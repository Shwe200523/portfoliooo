import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ステージ：3D を描く道具（レンダラー・シーン・カメラ・光・床の影）をまとめて用意する
//
// 器は画面に固定したキャンバスに描き、HTML の「器を置く場所」に合わせて見せる。
//   layout 0：SECTION 01 の右側に、割れた器がちょうど入る大きさ・位置
//   layout 1：SECTION 02 の左側に、完成した器がちょうど入る大きさ・位置
// スクロールで layout が 0 → 1 になると、器が右から左へ移りながら組み上がる。
// 位置はカメラのレンズをずらして動かすので（setViewOffset）、器の見え方（遠近感）は変わらない。
var createStage = (function () {
  'use strict';

  // 背景写真 img/haikei.png の大きさと、壁と床の境目（写真の上から何割の位置か）
  // css/top.css の .photo（cover・縦位置 50%）と合わせている
  var BACKDROP = { width: 1671, height: 941, floorLine: 0.733, posY: 0.5 };

  var CAMERA = {
    fov: 32, // カメラの画角（度）
    elevation: 25, // 見下ろす角度（度）：器の内側のひびが見える角度
    target: new THREE.Vector3(0, 0.2, 0), // カメラが向く点（器の中心）
    dolly: 0.08, // 完成後に少し寄る量（距離に対する割合）
    drift: { azimuth: 3.5, elevation: 1, speed: 0.11 }, // カメラのゆっくりした揺れ（度）
  };

  var FIT = {
    heroFill: 1, // SECTION 01：割れた破片も含めて、置く場所いっぱいに
    processFill: 0.9, // SECTION 02：完成した器を、置く場所の 90% に（完成後に寄る分を残す）
    floorMargin: 0.02, // 影の中心を、写真の床の線より少し下に（画面の高さに対する割合）
  };

  var FLOOR_Y = -0.1; // 影を落とす床の高さ（器は少し浮かせている）

  var SHADOW = {
    contactOpacity: 0.5, // 器の真下のやわらかい影の濃さ
    contactSize: 1.0, // 器の真下の影の大きさ
    castOpacity: 0.16, // 光（左上の奥）から手前右へ落ちる影の濃さ
  };

  // ーーーーーーーーーーーーーーーーーーーー
  //   データ入力 done
  // ーーーーーーーーーーーーーーーーーーーー

  // ステージを作る
  //   canvas          ：3D を描くキャンバス
  //   options.getSlots：器を置く場所（各セクションが画面の一番上にあるときの位置と大きさ）を返す関数
  function createStage(canvas, options) {
    var getSlots = options.getSlots;

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 背景は透明にして、うしろの写真を見せる
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    var scene = new THREE.Scene();

    // 金属が黒くならないように、まわりの景色（環境マップ）を入れる
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.7;
    pmrem.dispose();

    var camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.05, 50);

    // 写真の光に合わせて、左上（少し奥）から当てる光。影は手前右の床に落ちる
    var key = new THREE.DirectionalLight(0xfff2e2, 1.2);
    key.position.set(-2.2, 3.4, -1.3);
    key.target.position.copy(CAMERA.target);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 14;
    key.shadow.blurSamples = 20;
    key.shadow.camera.left = -1.8;
    key.shadow.camera.right = 1.8;
    key.shadow.camera.top = 1.8;
    key.shadow.camera.bottom = -1.8;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 8;
    scene.add(key, key.target);

    // 床の影：光の影（ShadowMaterial）＋ 真下のぼかした丸い影
    // 床は影を計算する範囲の中に収めて、範囲の端が線に見えないようにする
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.ShadowMaterial({ color: 0x3a2b1c, opacity: SHADOW.castOpacity, depthWrite: false }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;

    var contact = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: createContactTexture(),
        transparent: true,
        depthWrite: false,
        opacity: SHADOW.contactOpacity,
        toneMapped: false,
      }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = FLOOR_Y + 0.001;
    contact.renderOrder = 1;
    scene.add(floor, contact);

    // ーーー ここからカメラの自動調整 ーーー

    var size = { width: 0, height: 0 };
    var layouts = [
      { distance: 3, shiftX: 0, shiftY: 0 },
      { distance: 3, shiftX: 0, shiftY: 0 },
    ];
    var shadowCenter = new THREE.Vector3(0, FLOOR_Y, 0);
    var projected = new THREE.Vector3();
    var direction = new THREE.Vector3();
    var subject = null; // 器の表面から拾った点（assembled：完成した器 / all：割れた器＋完成した器）

    // カメラを、器の中心から distance 離れた場所に置く（azimuth：横の角度、elevation：見下ろす角度）
    function placeCamera(distance, azimuthDeg, elevationDeg) {
      if (azimuthDeg === undefined) azimuthDeg = 0;
      if (elevationDeg === undefined) elevationDeg = CAMERA.elevation;
      var azimuth = THREE.MathUtils.degToRad(azimuthDeg);
      var elevation = THREE.MathUtils.degToRad(elevationDeg);
      direction.set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation));
      camera.position.copy(CAMERA.target).addScaledVector(direction, distance);
      camera.lookAt(CAMERA.target);
      camera.updateMatrixWorld();
    }

    // 点を画面に写したときの範囲（画面の左端・下端が -1、右端・上端が 1）
    function measure(points, distance) {
      placeCamera(distance);
      var box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      for (var i = 0; i < points.length; i++) {
        projected.copy(points[i]).project(camera);
        box.minX = Math.min(box.minX, projected.x);
        box.maxX = Math.max(box.maxX, projected.x);
        box.minY = Math.min(box.minY, projected.y);
        box.maxY = Math.max(box.maxY, projected.y);
      }
      return box;
    }

    // fits(距離) が true になる、いちばん近い距離を探す（遠いほど小さく映る。半分ずつ絞りこむ）
    function solveDistance(fits) {
      var near = 0.5;
      var far = 40;
      for (var i = 0; i < 28; i++) {
        var mid = (near + far) / 2;
        if (fits(mid)) far = mid;
        else near = mid;
      }
      return far;
    }

    // 画面の px を、-1 〜 1 の値に直す（横）
    function toNdcX(px) {
      return (px / size.width) * 2 - 1;
    }

    // 画面の px を、-1 〜 1 の値に直す（縦。上が 1）
    function toNdcY(px) {
      return 1 - (px / size.height) * 2;
    }

    // 器（points）を置く場所（rect）に収めるための、カメラの距離とレンズのずらし量を求める
    function fitToSlot(points, rect, fill) {
      var maxWidth = ((rect.width * fill) / size.width) * 2;
      var maxHeight = ((rect.height * fill) / size.height) * 2;

      var distance = solveDistance(function (d) {
        var box = measure(points, d);
        return box.maxX - box.minX <= maxWidth && box.maxY - box.minY <= maxHeight;
      });

      // 置く場所の真ん中へ
      var box = measure(points, distance);
      var shiftX = toNdcX(rect.left + rect.width / 2) - (box.minX + box.maxX) / 2;
      var shiftY = toNdcY(rect.top + rect.height / 2) - (box.minY + box.maxY) / 2;

      // 影の中心が写真の床の線より上なら、床に乗るまで下げる（置く場所の下端は越えない）
      var floorNdc = 1 - 2 * (floorLineRatio(size.width, size.height) + FIT.floorMargin);
      var shadowNdc = projected.copy(shadowCenter).project(camera).y + shiftY;
      if (shadowNdc > floorNdc) {
        var room = Math.max(0, box.minY + shiftY - toNdcY(rect.bottom));
        shiftY -= Math.min(shadowNdc - floorNdc, room);
      }
      return { distance: distance, shiftX: shiftX, shiftY: shiftY };
    }

    // 画面の大きさに合わせて、SECTION 01・02 それぞれのカメラの位置を決める
    function fit() {
      camera.aspect = size.width / size.height;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      if (!subject) return;

      var slots = getSlots();
      layouts[0] = fitToSlot(subject.all, slots[0], FIT.heroFill);
      layouts[1] = fitToSlot(subject.assembled, slots[1], FIT.processFill);
    }

    // キャンバスの大きさが変わったら、描く大きさとカメラを合わせ直す
    function resize() {
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      if (!width || !height || (width === size.width && height === size.height)) return;
      size.width = width;
      size.height = height;
      renderer.setSize(width, height, false);
      fit();
    }

    new ResizeObserver(resize).observe(canvas);
    resize();

    return {
      renderer: renderer,
      scene: scene,
      camera: camera,

      // 器をステージに置く
      add: function (object) {
        scene.add(object);
      },

      // 器の表面の点を受け取って、カメラの位置を決める
      setSubject: function (points) {
        subject = points;
        fit();
      },

      // 文字の大きさなどが変わったときに、カメラの位置を計算し直す
      refit: fit,

      // 毎フレーム：カメラ（場所の移動・ゆっくりした揺れ・完成後に寄る）と影を更新する
      //   state        ：スクロールで変わる値
      //   time         ：始まってからの秒数
      //   floatY       ：器が浮いて上下にずれた量
      //   reducedMotion：「動きを減らす」設定なら true
      update: function (state, time, floatY, reducedMotion) {
        var from = layouts[0];
        var to = layouts[1];
        var t = state.layout;
        var lerp = THREE.MathUtils.lerp;

        var drift = reducedMotion ? 0 : 1;
        placeCamera(
          lerp(from.distance, to.distance, t) * (1 - CAMERA.dolly * state.spin),
          drift * Math.sin(time * CAMERA.drift.speed) * CAMERA.drift.azimuth,
          CAMERA.elevation + drift * Math.sin(time * CAMERA.drift.speed * 0.7 + 1.1) * CAMERA.drift.elevation,
        );
        camera.setViewOffset(
          size.width,
          size.height,
          (-lerp(from.shiftX, to.shiftX, t) * size.width) / 2,
          (lerp(from.shiftY, to.shiftY, t) * size.height) / 2,
          size.width,
          size.height,
        );

        var spread = 1 - state.assemble; // 割れて広がっているほど、影も広く
        var lift = THREE.MathUtils.clamp(floatY * 8, -0.15, 0.4); // 浮くほど、影はうすく広く
        contact.scale.setScalar(SHADOW.contactSize * (1 + 0.2 * spread) * (1 + lift * 0.5));
        contact.material.opacity = SHADOW.contactOpacity * (1 - lift);
      },

      // 1 枚描く
      render: function () {
        renderer.render(scene, camera);
      },
    };
  }

  // 背景写真（cover で表示）の床の線が、画面の上から何割の位置にあるか
  function floorLineRatio(width, height) {
    var scale = Math.max(width / BACKDROP.width, height / BACKDROP.height);
    var imageHeight = BACKDROP.height * scale;
    return ((height - imageHeight) * BACKDROP.posY + BACKDROP.floorLine * imageHeight) / height;
  }

  // 器の真下のやわらかい影（中心から外へうすくなる丸）の画像を作る
  function createContactTexture() {
    var size = 256;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(52, 40, 28, 1)');
    gradient.addColorStop(0.25, 'rgba(52, 40, 28, 0.75)');
    gradient.addColorStop(0.5, 'rgba(52, 40, 28, 0.32)');
    gradient.addColorStop(0.78, 'rgba(52, 40, 28, 0.08)');
    gradient.addColorStop(1, 'rgba(52, 40, 28, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    var texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // ーーーーーーーーーーーーーーーーーーーー
  //   コード（関数） done
  // ーーーーーーーーーーーーーーーーーーーー

  return createStage;
})();

export { createStage };

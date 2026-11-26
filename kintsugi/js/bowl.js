import * as THREE from 'three';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { setupKintsugiGold } from './gold.js';

// 器（assets/models/kintsugi_site.glb）を読み込んで、スクロールの値（state）に合わせて動かす
//
// GLB の中身
//   Bowl_Pieces → Piece_01〜07：完成したときの正しい位置にある破片（Piece_01 は高台）
//   Bowl_Intact：完成した 1 つの器
//   Kintsugi_Gold：金継ぎの線（UV の x が、線に沿って 0 → 1）
// 割れた状態の並べ方は GLB に入っていないので、ここで毎回同じになる乱数から作る。
var loadBowl = (function () {
  'use strict';

  // three.js のバージョンは index.html の importmap とそろえる
  var DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/';

  var BOWL_CENTER = new THREE.Vector3(0, 0.2, 0); // 器の中心

  // 割れた状態：ひと目で「割れた器」とわかるくらいにして、飛び散らせない
  var SCATTER = {
    seed: 1192, // 乱数のもとになる数（同じ数なら毎回同じ並び方になる）
    push: [0.12, 0.15], // 器の中心から外へずらす量（最小・最大）
    tilt: [8, 12], // 外側へかたむける角度（度。最小・最大）
    twist: 4, // ねじれ（± 度）
    footDrop: 0.07, // Piece_01（高台）を下へずらす量
  };

  var ASSEMBLE = {
    stagger: 0.06, // 破片ごとに、集まり始めるのを少しずつ遅らせる量
    ease: gsap.parseEase('power2.inOut'), // 集まるときの速さの変化
    // 集まった破片は、閉じきる手前で止める（継ぎ目にすき間 = 裂け目が見える）。
    // 破片ごとに少しずつ変えて自然に。残りは金が流れ込むのに合わせて閉じる（close）
    hold: [0.93, 0.97],
  };

  var SPIN_DEG = 24; // 完成後に Y 軸でゆっくり回る角度（度）

  // 割れた断面（Fracture_Gold）は、この時点では金にせず、素焼きのようなマットな色にする
  var FRACTURE = { color: '#d9d3c9', roughness: 0.9 };

  var FLOAT = { height: 0.012, tilt: 0.012 }; // 待っている間の、ごくわずかな浮き沈みと揺れ

  // ーーーーーーーーーーーーーーーーーーーー
  //   データ入力 done
  // ーーーーーーーーーーーーーーーーーーーー

  // GLB を読み込んで、器を作る（読み込みの進み具合 0〜1 を onProgress に渡す）
  function loadBowl(url, onProgress) {
    var loader = new GLTFLoader();
    loader.setDRACOLoader(new DRACOLoader().setDecoderPath(DRACO_PATH));

    return loader
      .loadAsync(url, function (event) {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      })
      .then(function (gltf) {
        return createBowl(gltf.scene);
      });
  }

  // 読み込んだモデルから、動かせる器を作る
  function createBowl(model) {
    var pieces = [];
    for (var i = 1; i <= 7; i++) {
      pieces.push(model.getObjectByName('Piece_0' + i));
    }
    var intact = model.getObjectByName('Bowl_Intact');
    var gold = model.getObjectByName('Kintsugi_Gold');
    var piecesGroup = model.getObjectByName('Bowl_Pieces');

    // ーーー 見た目（マテリアル） ーーー
    var bisque = new THREE.MeshStandardMaterial({
      name: 'Fracture_Bisque',
      color: FRACTURE.color,
      roughness: FRACTURE.roughness,
      metalness: 0,
    });
    piecesGroup.traverse(function (object) {
      if (!object.isMesh) return;
      object.castShadow = true;
      if (object.material.name === 'Fracture_Gold') object.material = bisque;
    });
    intact.traverse(function (object) {
      if (object.isMesh) object.castShadow = true;
    });
    var goldUniforms = setupKintsugiGold(gold);

    // ーーー 入れ子：root（浮き沈み・揺れ）→ spin（完成後の回転）→ model ーーー
    var root = new THREE.Group();
    var spin = new THREE.Group();
    root.position.copy(BOWL_CENTER); // 揺れの中心を器の中心にする
    model.position.sub(BOWL_CENTER);
    spin.add(model);
    root.add(spin);

    // ーーー 割れた状態の並べ方 ーーー
    var rigs = createScatter(pieces);
    var span = 1 - (rigs.length - 1) * ASSEMBLE.stagger;

    // assemble：裂け目が残る位置まで集まる / close：残りのすき間を閉じる
    function applyAssemble(assemble, close) {
      rigs.forEach(function (rig) {
        var gather = ASSEMBLE.ease(THREE.MathUtils.clamp((assemble - rig.delay) / span, 0, 1)) * rig.hold;
        var t = gather + (1 - gather) * close;
        rig.piece.position.lerpVectors(rig.scatterPosition, rig.homePosition, t);
        rig.piece.quaternion.slerpQuaternions(rig.scatterQuaternion, rig.homeQuaternion, t);
      });
    }

    // すき間があるあいだ、外へずれた破片に金が隠れないように、金を手前へ寄せる量（= すき間のいちばん大きいずれ）
    function measureHoldGap() {
      applyAssemble(1, 1);
      root.updateMatrixWorld(true);
      var closed = sampleSurface(piecesGroup, 800);
      applyAssemble(1, 0);
      root.updateMatrixWorld(true);
      var open = sampleSurface(piecesGroup, 800);
      var max = 0;
      open.forEach(function (point, i) {
        max = Math.max(max, point.distanceTo(closed[i]));
      });
      return max + 0.002;
    }

    var pullDistance = measureHoldGap();

    // カメラの位置を決めるために、器の表面から点を拾う（割れた状態 ＋ 完成した状態）
    function samplePoints() {
      applyAssemble(0, 0);
      root.updateMatrixWorld(true);
      var scattered = sampleSurface(piecesGroup, 1200);
      var assembled = sampleSurface(intact, 800);
      return { assembled: assembled, all: scattered.concat(assembled) };
    }

    return {
      object: root,
      samplePoints: samplePoints,

      // 見た目を先に準備するため、いったん全部を表示する
      showAll: function () {
        piecesGroup.visible = true;
        intact.visible = true;
        gold.visible = true;
      },

      // 毎フレーム呼ぶ。state はスクロールで変わる値。
      // 表示の切りかえも state だけで決めるので、スクロールを戻してもおかしくならない。
      // 戻り値：浮き沈みで上下にずれた量（影の濃さに使う）
      update: function (state, time, intro, reducedMotion) {
        // 破片が集まり（裂け目が残る位置まで）、金が流れ込むのに合わせて閉じる
        applyAssemble(state.assemble, state.close);

        // 閉じきったら 1 つの器に切りかえる（見た目は変わらない）
        var merged = state.merge >= 0.5;
        piecesGroup.visible = !merged;
        intact.visible = merged;

        // 裂け目に沿って金が流れ込む
        gold.visible = state.gold > 0.001;
        goldUniforms.uProgress.value = state.gold;
        goldUniforms.uPull.value = pullDistance * (1 - state.close);

        // 完成後：Y 軸でゆっくり回る
        spin.rotation.y = THREE.MathUtils.degToRad(SPIN_DEG) * state.spin;

        // 待っている間の浮き沈み・揺れ（「動きを減らす」設定では止める）＋ 表示のときに少し浮き上がる
        var motion = reducedMotion ? 0 : 1;
        var floatY = motion * Math.sin(time * 0.8) * FLOAT.height - (1 - intro) * 0.05;
        root.position.y = BOWL_CENTER.y + floatY;
        root.rotation.x = motion * Math.sin(time * 0.53) * FLOAT.tilt;
        root.rotation.z = motion * Math.sin(time * 0.41 + 1.3) * FLOAT.tilt;

        return floatY;
      },
    };
  }

  // 割れた状態の、破片ごとの位置と向きを決める
  function createScatter(pieces) {
    var random = mulberry32(SCATTER.seed);
    var degToRad = THREE.MathUtils.degToRad;
    var up = new THREE.Vector3(0, 1, 0);

    // [最小, 最大] の間の数を、乱数で 1 つ選ぶ
    function between(range) {
      return range[0] + (range[1] - range[0]) * random();
    }

    var rigs = pieces.map(function (piece, i) {
      var homePosition = piece.position.clone();
      var homeQuaternion = piece.quaternion.clone();
      var scatterPosition = homePosition.clone();
      var tilt = new THREE.Quaternion();

      if (i === 0) {
        // Piece_01（高台）：少し下へ。わずかにかたむける
        scatterPosition.y -= SCATTER.footDrop;
        var angle = random() * Math.PI * 2;
        var axis = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        tilt.setFromAxisAngle(axis, degToRad(between(SCATTER.tilt)) * 0.75);
      } else {
        // 側面の破片：器の中心から外へずらして、外側へかたむける
        var outward = homePosition.clone().sub(BOWL_CENTER).normalize();
        scatterPosition.addScaledVector(outward, between(SCATTER.push));

        var radial = new THREE.Vector3(homePosition.x, 0, homePosition.z).normalize();
        var tangent = new THREE.Vector3().crossVectors(up, radial).normalize();
        var lean = new THREE.Quaternion().setFromAxisAngle(tangent, degToRad(between(SCATTER.tilt)));
        var twist = new THREE.Quaternion().setFromAxisAngle(radial, degToRad((random() * 2 - 1) * SCATTER.twist));
        tilt.multiplyQuaternions(lean, twist);
      }

      return {
        piece: piece,
        homePosition: homePosition,
        homeQuaternion: homeQuaternion,
        scatterPosition: scatterPosition,
        scatterQuaternion: tilt.multiply(homeQuaternion),
        delay: 0,
      };
    });

    // 裂け目が残る位置（並べ方の乱数とは別に、あとから決める）
    rigs.forEach(function (rig) {
      rig.hold = between(ASSEMBLE.hold);
    });

    // 組み上がる順番：高台 → 側面を手前から一周
    function azimuth(v) {
      return (Math.atan2(v.x, v.z) + Math.PI * 2) % (Math.PI * 2);
    }
    rigs
      .slice(1)
      .sort(function (a, b) {
        return azimuth(a.homePosition) - azimuth(b.homePosition);
      })
      .forEach(function (rig, k) {
        rig.delay = (k + 1) * ASSEMBLE.stagger;
      });

    return rigs;
  }

  // 形の頂点から、だいたい count 個の点を拾う（画面の中の位置で）
  function sampleSurface(object, count) {
    var meshes = [];
    object.traverse(function (child) {
      if (child.isMesh) meshes.push(child);
    });

    var total = 0;
    meshes.forEach(function (mesh) {
      total += mesh.geometry.attributes.position.count;
    });

    var step = Math.max(1, Math.floor(total / count));
    var points = [];
    meshes.forEach(function (mesh) {
      var position = mesh.geometry.attributes.position;
      for (var i = 0; i < position.count; i += step) {
        points.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
      }
    });
    return points;
  }

  // 毎回同じ並びになる乱数を作る（同じ seed なら、同じ数が同じ順で出る）
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ーーーーーーーーーーーーーーーーーーーー
  //   コード（関数） done
  // ーーーーーーーーーーーーーーーーーーーー

  return loadBowl;
})();

export { loadBowl };

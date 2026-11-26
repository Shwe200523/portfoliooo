import * as THREE from 'three';

// 金継ぎの線：ひび（破片の継ぎ目）に沿って、金が静かに流れ込む
//
// Kintsugi_Gold（ひびに沿った細い帯。UV の x が線に沿って 0 → 1、y が幅の向き）の見た目に、
// 「金がどこまで届いたか」（uProgress：0 → 1）を足して、少しずつ金を見せていく。
//   ・金がまだ届いていない部分は描かない
//   ・先の方は少し細く、通ったあとに線の幅いっぱいまで広がる。先の方だけ、ほんの少し光る
//   ・金は太いひびから流れ始め、枝分かれした細いひびには、太いひびの金が分かれ目に届いてから流れ込む
//   ・小さな丸い埋めは、真ん中から外へ広がる
//   ・uPull：破片が閉じきる前は、外へずれた破片に金が隠れないように、
//            カメラに向いた金だけを手前へ寄せて描く（画面の上での位置は変わらない）
var setupKintsugiGold = (function () {
  'use strict';

  var GOLD = {
    color: '#c8a45f', // 金の色
    metalness: 1, // 金属らしさ
    roughness: 0.3, // ざらつき（0 でつるつる）
    glowColor: '#ffd08a', // 先の方の光の色
    glowStrength: 0.35, // 先の方の光の強さ（派手にせず、ほんの少し）
    tipWidth: '0.60', // 流れ込む先の細さ（線の幅に対する割合）。通ったあとに幅いっぱいまで広がる
  };

  var FLOW = {
    mainLength: 0.3, // これより長い線を「太いひび」として、最初に流し始める（器の口の大きさ = 1）
    mainEnd: 0.7, // いちばん長いひびが流れ終わる位置（全体を 1 として。あとでそろえ直す）
    minSpan: 0.04, // 短い線でも、流れ込むのにかける最小の時間
    discSpan: 0.05, // 丸い埋めが広がる時間
  };

  // ーーーーーーーーーーーーーーーーーーーー
  //   データ入力 done
  // ーーーーーーーーーーーーーーーーーーーー

  // 金の線を準備して、金の進み具合などを変えるための値（uniforms）を返す
  function setupKintsugiGold(node) {
    var uniforms = {
      uProgress: { value: 0 },
      uPull: { value: 0 },
      uGlowColor: { value: new THREE.Color(GOLD.glowColor) },
      uGlowStrength: { value: GOLD.glowStrength },
    };

    var materials = [];
    node.traverse(function (object) {
      if (!object.isMesh) return;
      analyzeGoldLines(object.geometry);
      if (materials.indexOf(object.material) === -1) materials.push(object.material);
    });

    materials.forEach(function (material) {
      material.color.set(GOLD.color);
      material.metalness = GOLD.metalness;
      material.roughness = GOLD.roughness;
      material.onBeforeCompile = function (shader) {
        patchShader(shader, uniforms);
      };
      material.customProgramCacheKey = function () {
        return 'kintsugi-gold';
      };
    });

    return uniforms;
  }

  // three.js の金属の見た目（シェーダ）に、金が流れ込む処理を書き足す
  function patchShader(shader, uniforms) {
    shader.uniforms.uProgress = uniforms.uProgress;
    shader.uniforms.uPull = uniforms.uPull;
    shader.uniforms.uGlowColor = uniforms.uGlowColor;
    shader.uniforms.uGlowStrength = uniforms.uGlowStrength;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uPull;
        attribute float aGoldKind;
        attribute vec4 aGoldFlow;
        varying vec2 vGoldUv;
        varying float vGoldKind;
        varying vec4 vGoldFlow;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vGoldUv = uv;
        vGoldKind = aGoldKind;
        vGoldFlow = aGoldFlow;`,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        // カメラに向いた面だけ、見ている向きに沿って手前へ寄せる（奥行きだけ変わり、画面の上の位置は同じ）
        vec3 toCamera = normalize(-mvPosition.xyz);
        float facing = smoothstep(0.0, 0.3, dot(normalize(transformedNormal), toCamera));
        mvPosition.xyz += toCamera * uPull * facing;
        gl_Position = projectionMatrix * mvPosition;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uProgress;
        uniform vec3 uGlowColor;
        uniform float uGlowStrength;
        varying vec2 vGoldUv;
        varying float vGoldKind;   // 0：線 / 1：丸い埋め
        varying vec4 vGoldFlow;    // x：流れ始め / y：流れる時間 / z：線の長さ / w：向きを逆にするか`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float along = mix(vGoldUv.x, 1.0 - vGoldUv.x, vGoldFlow.w); // 線のはじめ 0 → おわり 1
        float radial = length(vGoldUv - 0.5) * 2.0;                // 丸の真ん中 0 → ふち 1
        float across = abs(vGoldUv.y - 0.5) * 2.0;                 // 線の真ん中 0 → ふち 1
        float front = mix(along, radial, vGoldKind);

        // この線で金がどこまで届いたか（0 → 1）と、この点がそこからどれだけ後ろか
        float reach = clamp((uProgress - vGoldFlow.x) / max(vGoldFlow.y, 1e-4), 0.0, 1.0);
        float behind = (reach - front) * vGoldFlow.z;

        // まだ金が届いていない部分は描かない。先の方は少し細く、通ったあとに幅いっぱいまで広がる
        float goldWidth = mix(` + GOLD.tipWidth + `, 1.0, smoothstep(0.0, 0.02, behind));
        if (reach <= 0.0 || behind < 0.0 || (vGoldKind < 0.5 && across > goldWidth)) discard;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        // 流れの先の方だけ、ほんの少し光らせて、後ろへ行くほどふつうの金になじませる
        float goldTip = exp(-behind / 0.012) * (1.0 - smoothstep(0.9, 1.0, uProgress));
        totalEmissiveRadiance += uGlowColor * goldTip * uGlowStrength;`,
      );
  }

  // 金の線を 1 本ずつ調べて、シェーダで使う値を頂点ごとに作る
  //   aGoldKind：0 = 線 / 1 = 小さな丸い埋め
  //   aGoldFlow：x = 流れ始めるタイミング、y = 流れ終わるまでの長さ（どちらも uProgress を基準にした値）
  //              z = 線の長さ、w = 流れる向きを逆にするか（枝は、太いひびとつながる側から流す）
  function analyzeGoldLines(geometry) {
    var position = geometry.getAttribute('position');
    var uv = geometry.getAttribute('uv');
    var count = position.count;
    var kindAttr = new Float32Array(count);
    var flowAttr = new Float32Array(count * 4);
    geometry.setAttribute('aGoldKind', new THREE.BufferAttribute(kindAttr, 1));
    geometry.setAttribute('aGoldFlow', new THREE.BufferAttribute(flowAttr, 4));

    var index = geometry.index;
    var triangleCount = (index ? index.count : count) / 3;

    // t 番目の三角形の、corner 番目（0〜2）の頂点の番号
    function vertexOf(t, corner) {
      return index ? index.getX(t * 3 + corner) : t * 3 + corner;
    }

    var points = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      points[i * 3] = position.getX(i);
      points[i * 3 + 1] = position.getY(i);
      points[i * 3 + 2] = position.getZ(i);
    }

    // 1) つながっている三角形をまとめる（= 線 1 本・丸 1 個）
    var parent = new Int32Array(count);
    for (var i2 = 0; i2 < count; i2++) parent[i2] = i2;

    // 頂点 i が入っているまとまりの代表の番号
    function find(i) {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    }

    for (var t = 0; t < triangleCount; t++) {
      var root = find(vertexOf(t, 0));
      for (var corner = 1; corner < 3; corner++) {
        var other = find(vertexOf(t, corner));
        if (other !== root) parent[other] = root;
      }
    }
    var islandOf = new Int32Array(count);
    var ids = new Map();
    for (var i3 = 0; i3 < count; i3++) {
      var r = find(i3);
      if (!ids.has(r)) ids.set(r, ids.size);
      islandOf[i3] = ids.get(r);
    }
    var n = ids.size;

    // 2) 線ごとに、UV の変わる速さ（面積で重みをつけた |∇u|²・|∇v|²）と、はじめ・おわり・真ん中の位置を集める
    var gradU = new Float64Array(n);
    var gradV = new Float64Array(n);
    var area = new Float64Array(n);
    var ends = [new Float64Array(n * 4), new Float64Array(n * 4), new Float64Array(n * 4)]; // はじめ・おわり・真ん中
    var p0 = new THREE.Vector3();
    var e1 = new THREE.Vector3();
    var e2 = new THREE.Vector3();

    for (var t2 = 0; t2 < triangleCount; t2++) {
      var i0 = vertexOf(t2, 0);
      var i1 = vertexOf(t2, 1);
      var iv2 = vertexOf(t2, 2);
      p0.fromArray(points, i0 * 3);
      e1.fromArray(points, i1 * 3).sub(p0);
      e2.fromArray(points, iv2 * 3).sub(p0);
      var a = e1.dot(e1);
      var b = e1.dot(e2);
      var c = e2.dot(e2);
      var det = a * c - b * b;
      if (det <= 1e-18) continue;
      var triArea = 0.5 * Math.sqrt(det);
      var id = islandOf[i0];
      area[id] += triArea;
      gradU[id] += triArea * gradientSq(a, b, c, det, uv.getX(i1) - uv.getX(i0), uv.getX(iv2) - uv.getX(i0));
      gradV[id] += triArea * gradientSq(a, b, c, det, uv.getY(i1) - uv.getY(i0), uv.getY(iv2) - uv.getY(i0));
    }

    for (var i4 = 0; i4 < count; i4++) {
      var u = uv.getX(i4);
      var slots = [2];
      if (u < 0.06) slots.push(0);
      if (u > 0.94) slots.push(1);
      for (var s = 0; s < slots.length; s++) {
        var sum = ends[slots[s]];
        var k = islandOf[i4] * 4;
        sum[k] += points[i4 * 3];
        sum[k + 1] += points[i4 * 3 + 1];
        sum[k + 2] += points[i4 * 3 + 2];
        sum[k + 3] += 1;
      }
    }

    // まとまり id の、はじめ（slot 0）・おわり（1）・真ん中（2）の位置
    function pointOf(slot, id) {
      var sum = ends[slot];
      var k = id * 4;
      var w = sum[k + 3] || 1;
      return [sum[k] / w, sum[k + 1] / w, sum[k + 2] / w];
    }

    // 3) 線か丸か、と長さ。u は線に沿って 0 → 1 なので、長さ ≒ 1 / |∇u|
    var isDisc = new Uint8Array(n);
    var length = new Float64Array(n);
    var isMain = new Uint8Array(n);
    var longest = 0;
    for (var d1 = 0; d1 < n; d1++) {
      var ratio = Math.sqrt(gradV[d1] / (gradU[d1] || 1e-12)); // u と v の変わる速さの比
      isDisc[d1] = ratio > 0.4 && ratio < 2.5 ? 1 : 0; // 同じくらいなら丸い埋め
      length[d1] = area[d1] > 0 ? 1 / Math.sqrt(gradU[d1] / area[d1] || 1e-12) : 0;
      if (!isDisc[d1]) longest = Math.max(longest, length[d1]);
    }
    for (var d2 = 0; d2 < n; d2++) {
      isMain[d2] = !isDisc[d2] && (length[d2] >= FLOW.mainLength || length[d2] === longest) ? 1 : 0;
    }
    var speed = longest / FLOW.mainEnd; // 金が流れる速さ（全体の進み具合あたりの長さ）

    // 4) 枝のひびは、いちばん近いほかの線につながっているとみなす
    function nearestVertex(point, exclude, mainOnly) {
      var best = -1;
      var bestDistance = Infinity;
      for (var v = 0; v < count; v++) {
        var vid = islandOf[v];
        if (vid === exclude || isDisc[vid] || (mainOnly && !isMain[vid])) continue;
        var dx = points[v * 3] - point[0];
        var dy = points[v * 3 + 1] - point[1];
        var dz = points[v * 3 + 2] - point[2];
        var dd = dx * dx + dy * dy + dz * dz;
        if (dd < bestDistance) {
          bestDistance = dd;
          best = v;
        }
      }
      return { vertex: best, distance: Math.sqrt(bestDistance) };
    }

    var delay = new Float64Array(n).fill(NaN);
    var span = new Float64Array(n);
    var flip = new Uint8Array(n);
    var attach = new Array(n);

    for (var d3 = 0; d3 < n; d3++) {
      if (isMain[d3]) {
        delay[d3] = 0;
        continue;
      }
      if (isDisc[d3]) {
        attach[d3] = nearestVertex(pointOf(2, d3), d3, false);
        continue;
      }
      // 太いひび（またはほかの枝）に近い側の端から流し込む
      var fromStart = nearestVertex(pointOf(0, d3), d3, false);
      var fromEnd = nearestVertex(pointOf(1, d3), d3, false);
      flip[d3] = fromEnd.distance < fromStart.distance ? 1 : 0;
      attach[d3] = flip[d3] ? fromEnd : fromStart;
    }

    for (var d4 = 0; d4 < n; d4++) {
      span[d4] = isDisc[d4] ? FLOW.discSpan : Math.max(FLOW.minSpan, length[d4] / speed);
    }

    // つながり先の線に、金が届いた時刻
    function reachTime(vertex) {
      var rid = islandOf[vertex];
      var ru = uv.getX(vertex);
      return delay[rid] + (flip[rid] ? 1 - ru : ru) * span[rid];
    }

    // 5) 太いひびから順に、つながっている線のタイミングを決めていく
    var changed = true;
    while (changed) {
      changed = false;
      for (var d5 = 0; d5 < n; d5++) {
        if (!Number.isNaN(delay[d5]) || (attach[d5] && attach[d5].vertex < 0)) continue;
        var target = islandOf[attach[d5].vertex];
        if (Number.isNaN(delay[target])) continue;
        delay[d5] = reachTime(attach[d5].vertex) + attach[d5].distance / speed;
        changed = true;
      }
    }
    // 枝どうしで輪になって決まらなかった線は、いちばん近い太いひびから
    for (var d6 = 0; d6 < n; d6++) {
      if (!Number.isNaN(delay[d6])) continue;
      var hit = nearestVertex(pointOf(isDisc[d6] ? 2 : flip[d6], d6), d6, true);
      delay[d6] = hit.vertex < 0 ? 0 : reachTime(hit.vertex) + hit.distance / speed;
    }

    // すべての線が uProgress = 1 で流れ終わるようにそろえる
    var lastEnd = 0;
    for (var d7 = 0; d7 < n; d7++) lastEnd = Math.max(lastEnd, delay[d7] + span[d7]);
    var scale = lastEnd > 0 ? 1 / lastEnd : 1;

    for (var i5 = 0; i5 < count; i5++) {
      var iid = islandOf[i5];
      kindAttr[i5] = isDisc[iid];
      flowAttr[i5 * 4] = delay[iid] * scale;
      flowAttr[i5 * 4 + 1] = span[iid] * scale;
      flowAttr[i5 * 4 + 2] = Math.max(length[iid], 1e-3);
      flowAttr[i5 * 4 + 3] = flip[iid];
    }
  }

  // 三角形の上で、値がどれだけ速く変わるか（の 2 乗）
  //   a・b・c・det：三角形の 2 本の辺から作った値 / d1・d2：2 本の辺に沿った値の変化
  function gradientSq(a, b, c, det, d1, d2) {
    return (c * d1 * d1 - 2 * b * d1 * d2 + a * d2 * d2) / det;
  }

  // ーーーーーーーーーーーーーーーーーーーー
  //   コード（関数） done
  // ーーーーーーーーーーーーーーーーーーーー

  return setupKintsugiGold;
})();

export { setupKintsugiGold };

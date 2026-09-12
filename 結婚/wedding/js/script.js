document.addEventListener("DOMContentLoaded", () => {

    // 「視差効果を減らす」設定になっているかどうか
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // GSAPとScrollTriggerが読み込めているか（CDNが落ちた時の保険）
    const hasGSAP = window.gsap && window.ScrollTrigger;

    // 指輪アニメを動かすのはPC幅のときだけ
    const wide = window.matchMedia("(min-width: 1025px)");

    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

    /* ============================================================
       ① オープニング（ローディング）
       ロゴを描き終わったらカバーを消して、本編を見せる。
       カバーが出ている間は、後ろがスクロールしないようにする。
       ============================================================ */
    function setupLoading() {
        const loading = document.getElementById("loading");
        if (!loading) return;

        // カバーが出ている間は、後ろをスクロールさせない
        document.body.classList.add("loading_on");

        // キャッチコピーを1文字ずつのspanに分けて、順番に出るようにする
        const text = document.querySelector(".loading__text");
        const chars = text.textContent.trim().split("");
        text.textContent = "";
        chars.forEach((char, i) => {
            const span = document.createElement("span");
            span.textContent = char;
            span.style.animationDelay = (2.3 + i * 0.08) + "s";
            text.append(span);
        });

        // ロゴと文字が出そろう時間。動きを減らす設定のときはすぐ消す
        const wait = reduced ? 600 : 4800;

        setTimeout(() => {
            loading.classList.add("is_done");
            document.body.classList.remove("loading_on");
        }, wait);
    }

    /* ============================================================
       ② ヘッダー
       少しスクロールしたら背景をつける。
       Craftみたいな暗いセクションに重なっている間は
       透明＋白文字に切り替える
       ============================================================ */
    const nav = document.getElementById("nav");
    const darkSections = Array.from(document.querySelectorAll(".craft"));

    function onScrollNav() {
        // 40pxより下にスクロールしたら背景あり
        nav.classList.toggle("is_scrolled", window.scrollY > 40);

        // ヘッダーの高さあたり（40px）が暗いセクションと重なっているか調べる
        const probeY = 40;
        const onDark = darkSections.some((s) => {
            const r = s.getBoundingClientRect();
            return r.top <= probeY && r.bottom >= probeY;
        });
        nav.classList.toggle("is_on_dark", onDark);
    }
    onScrollNav();
    window.addEventListener("scroll", onScrollNav, { passive: true });

    /* ============================================================
       ナビゲーションのオーバーレイメニュー
       ハンバーガーで全画面メニューを開閉する。
       ・開いている間は背面スクロールを止める
       ・Escキー / ×ボタン / メニュー内リンクで閉じる
       ============================================================ */
    (function setupMenu() {
        const toggle = document.getElementById("navToggle");
        const menu = document.getElementById("navMenu");
        const closeBtn = document.getElementById("navClose");
        if (!toggle || !menu) return;

        let isOpen = false;

        function open() {
            if (isOpen) return;
            isOpen = true;
            menu.hidden = false;
            // 次のフレームで開くクラスを付けてトランジションを効かせる
            requestAnimationFrame(() => menu.classList.add("is_open"));
            document.body.classList.add("menu_open");
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            menu.classList.remove("is_open");
            document.body.classList.remove("menu_open");
            // トランジション終了後に hidden へ戻す（フォーカス／読み上げ対象から外す）
            const done = () => { if (!isOpen) menu.hidden = true; };
            menu.addEventListener("transitionend", done, { once: true });
            // トランジションが無い環境（reduced motion 等）の保険
            setTimeout(done, 450);
            toggle.focus();
        }

        toggle.addEventListener("click", () => (isOpen ? close() : open()));
        closeBtn?.addEventListener("click", close);

        // メニュー内のリンクを押したら閉じてから遷移させる
        menu.querySelectorAll(".close_link").forEach((el) =>
            el.addEventListener("click", close)
        );

        // Escで閉じる
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && isOpen) close();
        });
    })();

    /* ============================================================
       ③ 指輪がセクション間を移動するアニメーション（PCのみ）
       .ring_slot の付いた場所を順番にめぐって、
       最後（リングコレクション一覧のショーケース）で止まる。
       セクションが画面の真ん中まで来たら1.5秒かけてフワッと飛ぶ
       ============================================================ */
    function setupRing() {
        const ring = document.getElementById("ring");

        // 指輪が立ち寄るスロットを上から順に取得
        const slots = Array.from(document.querySelectorAll(".ring_slot"));
        if (!ring || slots.length === 0) return;

        // 指輪ONの目印（スロット内の静止画リングを消すため）
        document.body.classList.add("ring_on");
        ring.style.display = "block";

        // スロットの中心座標と大きさを「ページ全体の座標」で測る
        function boxOf(slot) {
            const r = slot.getBoundingClientRect();
            return {
                cx: r.left + window.scrollX + r.width / 2,
                cy: r.top + window.scrollY + r.height / 2,
                w: Math.min(r.width, r.height) * 0.96,
            };
        }

        // 今の指輪の位置（ページ座標）と回転角
        const state = { cx: 0, cy: 0, w: 380, rot: 0 };
        let idx = 0;        // 今いるスロットの番号
        let flight = null;  // 移動中のアニメーション

        // 毎フレーム実行：
        // 移動中じゃなければ今いるスロットを測り直して吸着する
        // （画像の読み込みやリサイズでレイアウトが動いてもズレない）
        gsap.ticker.add(() => {
            if (!flight || !flight.isActive()) {
                const b = boxOf(slots[idx]);
                state.cx = b.cx;
                state.cy = b.cy;
                state.w = b.w;
                state.rot = idx * 360; // 静止中は必ず水平に戻す
            }
            // position:fixed の指輪をページ座標に合わせて置き直す
            gsap.set(ring, {
                x: state.cx - window.scrollX,
                y: state.cy - window.scrollY,
                xPercent: -50,
                yPercent: -50,
                width: state.w,
                rotation: state.rot,
            });
        });

        // 指定のスロットへ飛ぶ（1.5秒＋1回転）
        function flyTo(i) {
            if (i === idx) return; // すでにそこにいるなら何もしない
            idx = i;
            const b = boxOf(slots[i]);
            if (flight) flight.kill(); // 前の移動が残っていたら中断

            // 回転は「スロット番号×360度」の絶対値へ。
            // 相対値(+=360)だと上下に何度もスクロールした時に傾きが残る
            flight = gsap.to(state, {
                cx: b.cx,
                cy: b.cy,
                w: b.w,
                rot: i * 360,
                duration: 1.5,
                ease: "power2.inOut",
                overwrite: true,
                onComplete: () => { flight = null; },
            });
        }

        // 次のスロットが50%ぐらい見えてきたら飛ぶ（上から来ても下から来ても）
        // start "top 75%": 画面下から1/4の高さに上端が来た＝セクション下半分が見えた頃
        slots.forEach((slot, i) => {
            ScrollTrigger.create({
                trigger: slot,
                start: "top 75%",
                end: "bottom 25%",
                onEnter: () => flyTo(i),
                onEnterBack: () => flyTo(i),
            });
        });

        // 画面サイズが変わったら測り直し
        window.addEventListener("resize", () => ScrollTrigger.refresh());
    }

    /* ============================================================
       ④ Craft（一本の指輪ができるまで）
       セクションを画面に固定（pin）して、スクロール量で進行。
       順番は：
         イントロ（右側なにもなし）
         → 工程の「番号＋タイトル」が出る
         → タイトルが消えて「説明ボックス」が出る
         → 背景が下からスライドインで入れ替わって次の工程へ …
       1工程＝2セグメント。全体＝イントロ1＋工程5×2＝11セグメント
       ============================================================ */
    function setupCraft() {
        const craft = document.querySelector(".craft");
        if (!craft) return;

        const bgs = gsap.utils.toArray(".craft_bg");       // 背景画像（工程ごと）
        const thumbs = gsap.utils.toArray(".craft_thumb"); // 左下のサムネイル
        const panels = gsap.utils.toArray(".craft_panel"); // 右側のテキスト
        const bar = document.querySelector(".craft_progress span"); // 下の進行バー
        const steps = panels.length;

        // 1工程＝2セグメント（前半：番号＋タイトルだけ／後半：説明文も）
        // イントロ無し。入った瞬間から工程01の「番号＋タイトル」を表示。
        const segments = steps * 2;     // 工程数×2
        // 1セグメントのスクロール量（小さいほど全体が短く・間も短い）。
        // スマホは1スワイプの移動量が大きく工程を飛ばしやすいので長めにする。
        const perSeg = wide.matches ? 0.28 : 0.42;
        let lastStep = -1;              // 前回の工程（同じ工程内では見出しを出し直さない）
        let lastPhase = -1;             // 前回のフェーズ（0＝見出しのみ / 1＝説明も）

        // 各テキストが「今 表示されているか」を憶えておく（重複トランジション防止）
        const shown = new WeakMap();

        // 最初は工程テキストを全部隠しておく（下にクリップした状態）
        panels.forEach((panel) => {
            panel.querySelectorAll(".craft_index, .craft_step, .craft_note").forEach((el) => {
                gsap.set(el, { autoAlpha: 0, yPercent: 60, clipPath: "inset(0 0% 100% 0%)" });
                shown.set(el, false);
            });
        });

        // スマホはフリックで工程が飛びやすいので、テキストの出入りを長めにして
        // 「ぽん」と切り替わらず、ゆっくりクロスフェードするようにする。
        const revealDur = wide.matches ? 1.2 : 1.6;
        const concealDur = wide.matches ? 0.6 : 1.2;

        // 下からめくれ上がるように出す（一度出たら消さない）
        const reveal = (el, delay = 0) => gsap.to(el,
            { autoAlpha: 1, yPercent: 0, clipPath: "inset(0% 0% 0% 0%)",
              duration: revealDur, delay, ease: "power3.out", overwrite: true });

        // 工程が切り替わるときだけ、下へめくり戻して消す
        const conceal = (el) => gsap.to(el,
            { autoAlpha: 0, yPercent: 60, clipPath: "inset(0 0% 100% 0%)",
              duration: concealDur, ease: "power2.inOut", overwrite: true });

        // 状態が変わった要素にだけ reveal/conceal を当てるラッパー
        const show = (el, delay = 0) => {
            if (!el || shown.get(el) === true) return;
            shown.set(el, true);
            reveal(el, delay);
        };
        const hide = (el) => {
            if (!el || shown.get(el) === false) return;
            shown.set(el, false);
            conceal(el);
        };

        // セグメント番号に応じて表示を切り替える。
        // 下スクロールでも上スクロールでも同じ結果になるよう、
        // 「今の(step,phase)ならこう見えているはず」という状態を毎回まるごと組み立てる。
        // （前回との差分を積み上げる方式だと、上へ戻ったときに辻褄が合わなくなる）
        function apply(seg) {
            const step = Math.floor(seg / 2); // 工程番号（0＝焼きなまし）
            const phase = seg % 2;            // 0＝番号＋タイトルだけ / 1＝説明文も
            if (step === lastStep && phase === lastPhase) return; // 変化なしなら何もしない

            const stepChanged = step !== lastStep;

            // 背景とサムネイルは今の工程だけを選択状態に（毎回そろえ直す）
            bgs.forEach((el, n) => el.classList.toggle("is_active", n === step));
            thumbs.forEach((el, n) => el.classList.toggle("is_active", n === step));

            // 今の工程以外のパネルは、番号・タイトル・説明すべて隠す。
            // 上スクロールで工程を飛ばしても取り残しが出ないよう、全パネルを毎回点検する。
            panels.forEach((p, n) => {
                if (n === step) return;
                hide(p.querySelector(".craft_index"));
                hide(p.querySelector(".craft_step"));
                hide(p.querySelector(".craft_note"));
            });

            // 今の工程：番号＋タイトルは常に表示。工程が変わった瞬間だけ軽い時間差をつける。
            const p = panels[step];
            show(p.querySelector(".craft_index"), 0);
            show(p.querySelector(".craft_step"), stepChanged ? 0.15 : 0);

            // 説明文はフェーズで出し入れ（後半＝1で表示、前半＝0で非表示）
            const note = p.querySelector(".craft_note");
            if (phase === 1) show(note, 0);
            else hide(note);

            lastStep = step;
            lastPhase = phase;
        }

        // 全部を初期状態（テキスト隠し・背景1枚目のみ）に戻す。
        // セクションが100vhになる前や、上へ抜けたときにこの状態を保つ。
        function resetToStart() {
            panels.forEach((panel) => {
                panel.querySelectorAll(".craft_index, .craft_step, .craft_note").forEach((el) => {
                    gsap.set(el, { autoAlpha: 0, yPercent: 60, clipPath: "inset(0 0% 100% 0%)" });
                    shown.set(el, false); // 表示状態の記録も「隠れている」に戻す
                });
            });
            bgs.forEach((el, n) => el.classList.toggle("is_active", n === 0));
            thumbs.forEach((el, n) => el.classList.toggle("is_active", n === 0));
            if (bar) bar.style.width = "0%";
            lastStep = -1;
            lastPhase = -1;
        }

        // セクションを固定して、スクロールの進み具合をセグメントに変換
        const st = ScrollTrigger.create({
            trigger: craft,
            // Craftが画面いっぱい(100vh)になってから固定＆工程スタート。
            // anticipatePin は付けない（付けると100vhになる手前で固定が始まってしまう）
            start: "top top",
            end: () => "+=" + Math.round(window.innerHeight * perSeg * segments),
            pin: true,
            pinSpacing: true,
            // スクロールにアニメを慣性付きで追従させて滑らかに。
            // スマホはフリックで急に動くので粘りを強めてPC版のような滑らかさにする。
            scrub: wide.matches ? 1 : 1.6,
            // 100vhに到達してピンが始まった瞬間に、初めて工程01を出す。
            onEnter: () => apply(0),
            onEnterBack: () => apply(0),
            // 上へスクロールしてピン領域を抜けたら、テキストを隠して初期状態へ戻す。
            onLeaveBack: () => resetToStart(),
            onUpdate: (self) => {
                const seg = Math.min(segments - 1, Math.floor(self.progress * segments));
                apply(seg);
                // 進行バーの幅も更新
                if (bar) bar.style.width = (self.progress * 100) + "%";
            },
        });

        // サムネイルをクリックしたらその工程の位置までスクロール
        thumbs.forEach((thumb) => thumb.addEventListener("click", () => {
            const seg = Number(thumb.dataset.goto) * 2 + 1; // 工程n → 説明も出た状態(n*2+1)へ
            const p = (seg + 0.4) / segments;
            window.scrollTo({ top: st.start + (st.end - st.start) * p, behavior: "smooth" });
        }));
    }

    /* ============================================================
       Craftの保険（GSAPが読めない時・動きを減らす設定の時）
       固定せず、普通に縦に並べて全部見えるようにする
       ============================================================ */
    function setupCraftStatic() {
        const craft = document.querySelector(".craft");
        if (!craft) return;

        craft.style.height = "auto";
        // 下は詰める。最後の工程の説明ボックスのすぐ下で次セクションへ切り替わるように。
        craft.style.padding = "7rem 0 0";

        const panels = craft.querySelector(".craft_panels");
        if (panels) {
            Object.assign(panels.style, {
                position: "relative",
                transform: "none",
                top: "auto",
                marginTop: "8rem",
            });
        }

        // パネルを普通の流れ（縦並び）に戻す。
        // 表示状態(opacity)はGSAPの有無で扱いを分ける。
        const panelEls = Array.from(document.querySelectorAll(".craft_panel"));
        panelEls.forEach((p, i) => {
            Object.assign(p.style, {
                position: "relative",
                top: "auto",
                pointerEvents: "auto",
                // 工程どうしの間だけ余白を空け、最後の工程の下は詰める
                marginBottom: i === panelEls.length - 1 ? "0" : "3rem",
            });
        });

        // 背景は1枚目だけ表示（スマホでは.craft_stage自体はCSSで非表示）
        craft.querySelector(".craft_bg")?.classList.add("is_active");

        // ---- スクロール連動アニメーション ----
        // GSAPが無い/動きを減らす設定のときは、動かさずに全部表示のまま。
        if (!hasGSAP || reduced) {
            panelEls.forEach((p) => {
                p.style.transform = "none";
                p.style.opacity = "1";
            });
            return;
        }

        // 各パネルを「透明＋少し下」から、画面に入ったらふわっとせり上げる。
        // 写真(.craft_figure)はテキストより少し遅らせて出すと上品。
        panelEls.forEach((p) => {
            const fig = p.querySelector(".craft_figure");
            const texts = p.querySelectorAll(".craft_index, .craft_step, .craft_note");

            gsap.set(p, { autoAlpha: 1 });          // パネル自体は表示（中身を動かす）
            gsap.set(fig, { autoAlpha: 0, y: 40, scale: 1.04 });
            gsap.set(texts, { autoAlpha: 0, y: 40 });

            const tl = gsap.timeline({
                scrollTrigger: { trigger: p, start: "top 82%" },
            });
            tl.to(fig, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: "power3.out" })
              .to(texts, { autoAlpha: 1, y: 0, duration: 1.0, ease: "power3.out", stagger: 0.12 }, "-=0.7");
        });
    }

    /* ============================================================
       ⑤ コンテンツのリビール演出
       スクロールして画面に入ってきた要素をフワッと出す。
       リストの仲間（.collection-rowなど）はまとめて時間差で出す
       ============================================================ */
    function setupReveals() {
        // フェード対象のセレクタ一覧
        const sel = [
            ".hero_title", ".hero_lede", ".hero_copy .textlink",
            ".concept_title", ".concept_body", ".concept .accent_line",
            ".detail_copy", ".detail_spec", ".detail_foot",
            ".only_one_copy > *",
            ".product_list_title", ".product_list_hero", ".product_list_aside > *",
            ".section_title", ".collection_row",
            ".whyus_item", ".whyus_cta",
            ".flow_item",
            ".news_row",
            ".review_card",
            ".stores_area", ".stores_footer",
            ".reserve_head > *", ".reserve_aside", ".reserve_form",
            ".contact_head > *", ".contact_form", ".contact_info",
            ".reservation > *",
            ".footer_top",
        ];

        // Craftの中身は②で動かすのでここでは除外する
        const els = [];
        sel.forEach((s) => document.querySelectorAll(s).forEach((el) => {
            if (!el.closest(".craft")) els.push(el);
        }));

        // GSAPが無いとき／動きを減らす設定のときは、隠さず全部表示のまま
        if (!hasGSAP || reduced) {
            els.forEach((el) => el.classList.remove("reveal"));
            return;
        }

        // 最初は透明＋少し下げた状態にしておく
        els.forEach((el) => el.classList.add("reveal"));
        gsap.set(els, { autoAlpha: 0, y: 40, scale: 0.985 });

        // hero（ファーストビュー）は画面に最初から入っているので、スクロール発火に
        // 頼らず、ロード直後に「ゆっくり・時間差で」導入する。順番はDOMの並び（タイトル→本文→リンク）。
        // オープニングのカバーが消えるのが4.8秒後なので、そこに合わせて始める。
        const heroEls = els.filter((el) => el.closest(".hero"));
        const heroSet = new Set(heroEls);
        gsap.to(heroEls, {
            autoAlpha: 1, y: 0, scale: 1,
            duration: 1.8, ease: "power3.out",
            delay: 4.8,         // カバーが消えるのと同時に立ち上がる
            stagger: 0.35,      // タイトル→本文→リンクを順にフワッと
        });

        // 時間差でまとめて出すグループ
        const groups = [".collection_row", ".whyus_item", ".flow_item", ".news_row", ".review_card", ".stores_area"];
        const grouped = new Set();
        groups.forEach((g) => document.querySelectorAll(g).forEach((el) => grouped.add(el)));

        // 単発の要素：画面の85%位置まで来たら、下からせり上がって出る（動きを大きめに）
        els.forEach((el) => {
            if (grouped.has(el) || heroSet.has(el)) return; // グループとheroは別処理
            gsap.to(el, {
                autoAlpha: 1, y: 0, scale: 1, duration: 1.4, ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 85%" },
            });
        });

        // グループの要素：0.18秒ずつずらして、次々にせり上がる
        groups.forEach((g) => ScrollTrigger.batch(g, {
            start: "top 85%",
            onEnter: (batch) => gsap.to(batch, {
                autoAlpha: 1, y: 0, scale: 1, duration: 1.3, ease: "power3.out",
                stagger: 0.18, overwrite: true,
            }),
        }));

        // 保険：Craft の pin などで既に画面内に入ってしまった要素は、
        // 発火し損ねると隠れたままになるので、読み込み後に見えている分を強制表示する
        const revealNow = () => {
            els.forEach((el) => {
                if (heroSet.has(el)) return; // heroはロード時アニメで処理済み
                const r = el.getBoundingClientRect();
                if (r.top < window.innerHeight && r.bottom > 0 && parseFloat(getComputedStyle(el).opacity) < 0.05) {
                    gsap.to(el, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out", overwrite: true });
                }
            });
        };
        window.addEventListener("load", () => setTimeout(revealNow, 600));
    }

    // 価格表示：（税込）だけ小さく表示する
    function setPriceText(el, str) {
        const s = String(str);
        const i = s.indexOf("（税込）");
        el.textContent = "";
        if (i === -1) { el.textContent = s; return; }
        const tax = document.createElement("span");
        tax.className = "price_tax";
        tax.textContent = "（税込）";
        el.append(s.slice(0, i), tax, s.slice(i + 4));
    }

    /* ============================================================
       ⑥ Product List：カードをクリックすると
       「選んだ指輪が箱へ」「箱の指輪がカードへ」入れ替わる
       ============================================================ */
    function setupPlistSwap() {
        // 箱の中の指輪＝スクロールで飛んでくる共有 #ring そのもの（スクロール演出は触らない）
        const sharedRing = document.getElementById("ring");
        const boxStage = document.querySelector(".product_list_stage"); // 箱の中の着地位置
        const cards = Array.from(document.querySelectorAll(".product_card"));
        const priceLabel = document.querySelector(".p_price");
        const matLabel = document.querySelector(".p_mat");
        const matEnLabel = document.querySelector(".p_maten");
        const heroBox = document.querySelector(".product_list_hero"); // 箱（初期detail情報の持ち主）
        if (!sharedRing || !boxStage || cards.length === 0) return;

        // Detail セクションの連動対象（選んだ指輪に合わせてフェードで切替）
        const detail = {
            name: document.querySelector(".d_name"),
            nameJp: document.querySelector(".d_name_jp"),
            stone: document.querySelector(".d_stone"),
            meta: document.querySelector(".d_meta"),
            price: document.querySelector(".d_price"),
            body: document.querySelector(".d_body"),
        };

        // 箱に今入っている指輪の状態（初期はダイヤ = #ring の src）＋ Detail用の一式
        const boxState = {
            src: sharedRing.getAttribute("src"),
            mat: matLabel ? matLabel.textContent : "",
            matEn: matEnLabel ? matEnLabel.textContent : "",
            price: priceLabel ? priceLabel.textContent : "",
            // Detail用（初期値は .product_list_hero の data 属性＝ダイヤ）
            name: heroBox ? heroBox.dataset.name : "",
            nameJp: heroBox ? heroBox.dataset.nameJp : "",
            stone: heroBox ? heroBox.dataset.stone : "",
            meta: heroBox ? heroBox.dataset.meta : "",
            body: heroBox ? heroBox.dataset.body : "",
        };

        // Detail の内容を、選んだ指輪の情報にフェードで差し替える
        function updateDetail(info) {
            const foot = document.querySelector(".detail_foot");
            const copy = document.querySelector(".detail_copy");
            const spec = document.querySelector(".detail_spec");
            const apply = () => {
                if (detail.name) detail.name.textContent = info.name;
                if (detail.nameJp) detail.nameJp.textContent = info.nameJp;
                if (detail.stone) detail.stone.textContent = info.stone;
                if (detail.meta) detail.meta.textContent = info.meta;
                if (detail.price) setPriceText(detail.price, info.price);
                // body は "<br>" 区切りの固定テキスト。innerHTMLを避けて安全にDOM生成する
                if (detail.body) {
                    detail.body.textContent = "";
                    String(info.body).split(/<br\s*\/?>/i).forEach((line, i) => {
                        if (i > 0) detail.body.appendChild(document.createElement("br"));
                        detail.body.appendChild(document.createTextNode(line));
                    });
                }
            };
            const targets = [foot, copy, spec].filter(Boolean);
            if (!hasGSAP || targets.length === 0) { apply(); return; }
            // ふわっとフェードアウト → 差し替え → フェードイン
            gsap.to(targets, {
                autoAlpha: 0, y: 8, duration: 0.4, ease: "power2.in", overwrite: true,
                onComplete: () => {
                    apply();
                    gsap.to(targets, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", overwrite: true });
                },
            });
        }

        let swapping = false;

        // 要素の画面上の中心座標と一辺サイズを測る
        const rectOf = (el) => {
            const r = el.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: Math.min(r.width, r.height) };
        };

        // 指定の src の指輪を、from の位置から to の位置へ飛ばす（浮遊コピー）
        function fly(src, from, to, rotate) {
            return new Promise((resolve) => {
                const img = document.createElement("img");
                img.src = src;
                img.alt = "";
                Object.assign(img.style, {
                    position: "fixed", top: "0", left: "0", objectFit: "contain",
                    pointerEvents: "none", zIndex: "120",
                    filter: "drop-shadow(0 30px 50px rgba(44,52,65,.22))", willChange: "transform",
                });
                document.body.appendChild(img);

                if (!hasGSAP) { img.remove(); resolve(); return; } // アニメ無し環境

                const st = { cx: from.cx, cy: from.cy, w: from.w, rot: 0 };
                const place = () => gsap.set(img, {
                    x: st.cx, y: st.cy, xPercent: -50, yPercent: -50, width: st.w, rotation: st.rot,
                });
                place();
                gsap.to(st, {
                    cx: to.cx, cy: to.cy, w: to.w, rot: rotate ? 360 : 0,
                    duration: 1.1, ease: "power2.inOut",
                    onUpdate: place,
                    onComplete: () => { img.remove(); resolve(); },
                });
            });
        }

        async function swap(card) {
            if (swapping) return;              // 連打対策
            const cardImg = card.querySelector(".product_card_img img");
            const cardMatEl = card.querySelector(".product_card_mat");
            const cardPriceEl = card.querySelector(".product_card_price");
            const picked = {
                src: card.dataset.ringSrc, mat: card.dataset.mat, matEn: card.dataset.matEn, price: card.dataset.price,
                name: card.dataset.name, nameJp: card.dataset.nameJp,
                stone: card.dataset.stone, meta: card.dataset.meta, body: card.dataset.body,
            };
            if (picked.src === boxState.src) return; // すでに箱にある指輪なら何もしない

            swapping = true;

            // 飛ばす前の位置を採寸（箱の指輪は共有 #ring の現在位置）
            const cardRect = rectOf(cardImg);
            const boxRect = rectOf(sharedRing);

            // 実物を隠して浮遊コピーで動かす（#ring は消さず一時的に透明化するだけ）
            const ringVisPrev = sharedRing.style.visibility;
            sharedRing.style.visibility = "hidden";
            cardImg.style.visibility = "hidden";

            // A: カードの指輪 → 箱へ ／ B: 箱の指輪 → カードへ（同時）
            await Promise.all([
                fly(picked.src, cardRect, boxRect, true),
                fly(boxState.src, boxRect, cardRect, true),
            ]);

            // 入れ替え確定：箱(#ring)には選んだ指輪、カードには元・箱の指輪
            const prevBox = { ...boxState };
            sharedRing.setAttribute("src", picked.src); // ← 共有リングは src だけ差し替え（scroll効果は維持）
            if (priceLabel) setPriceText(priceLabel, picked.price);
            if (matLabel) matLabel.textContent = picked.mat;
            if (matEnLabel) matEnLabel.textContent = picked.matEn;
            // 箱の状態を選んだ指輪に更新（Detail用の一式も）
            Object.assign(boxState, {
                src: picked.src, mat: picked.mat, matEn: picked.matEn, price: picked.price,
                name: picked.name, nameJp: picked.nameJp, stone: picked.stone, meta: picked.meta, body: picked.body,
            });

            // カードには元・箱の指輪を戻す（Detail用 data も入れ替え）
            cardImg.src = prevBox.src;
            if (cardMatEl) cardMatEl.textContent = prevBox.mat;
            if (cardPriceEl) setPriceText(cardPriceEl, prevBox.price);
            card.dataset.ringSrc = prevBox.src;
            card.dataset.mat = prevBox.mat;
            card.dataset.matEn = prevBox.matEn;
            card.dataset.price = prevBox.price;
            card.dataset.name = prevBox.name;
            card.dataset.nameJp = prevBox.nameJp;
            card.dataset.stone = prevBox.stone;
            card.dataset.meta = prevBox.meta;
            card.dataset.body = prevBox.body;

            // Detail セクションを箱の指輪（＝選んだ指輪）に合わせてフェードで切替
            updateDetail(boxState);

            sharedRing.style.visibility = ringVisPrev;
            cardImg.style.visibility = "";
            swapping = false;
        }

        cards.forEach((card) => card.addEventListener("click", (e) => {
            e.preventDefault();
            swap(card);
        }));
    }

    /* ============================================================
       スマホ専用：コレクションの指輪入れ替え
       PC版(setupPlistSwap)は飛ぶ#ringを動かすが、スマホでは#ringが
       非表示で何も見えない。こちらは箱の中の専用img(.product_list_ring_mb)を
       直接差し替え、選んだサムネをハイライトして「どれが入っているか」を示す。
       PC版のコードには一切触れない。
       ============================================================ */
    function setupPlistSwapMobile() {
        const boxRing = document.querySelector(".product_list_ring_mb"); // 箱の中の指輪(スマホ)
        const cards = Array.from(document.querySelectorAll(".product_card"));
        const priceLabel = document.querySelector(".p_price");
        const matLabel = document.querySelector(".p_mat");
        const matEnLabel = document.querySelector(".p_maten");
        const heroBox = document.querySelector(".product_list_hero");
        if (!boxRing || cards.length === 0) return;

        // 箱に今入っている指輪の状態（初期はダイヤ）
        const boxState = {
            src: boxRing.getAttribute("src"),
            mat: matLabel ? matLabel.textContent : "",
            matEn: matEnLabel ? matEnLabel.textContent : "",
            price: priceLabel ? priceLabel.textContent : "",
            name: heroBox ? heroBox.dataset.name : "",
            nameJp: heroBox ? heroBox.dataset.nameJp : "",
            stone: heroBox ? heroBox.dataset.stone : "",
            meta: heroBox ? heroBox.dataset.meta : "",
            body: heroBox ? heroBox.dataset.body : "",
        };

        function swapMobile(card) {
            const cardImg = card.querySelector(".product_card_img img");
            const cardMatEl = card.querySelector(".product_card_mat");
            const cardPriceEl = card.querySelector(".product_card_price");
            const picked = {
                src: card.dataset.ringSrc, mat: card.dataset.mat, matEn: card.dataset.matEn, price: card.dataset.price,
                name: card.dataset.name, nameJp: card.dataset.nameJp,
                stone: card.dataset.stone, meta: card.dataset.meta, body: card.dataset.body,
            };
            if (picked.src === boxState.src) return; // すでに箱にある指輪

            const prevBox = { ...boxState };

            // 箱にはサッと入れ替わる小さなアニメを付ける
            boxRing.style.transition = "opacity 0.25s ease, transform 0.35s ease";
            boxRing.style.opacity = "0";
            boxRing.style.transform = "scale(0.85)";
            setTimeout(() => {
                boxRing.setAttribute("src", picked.src);
                boxRing.style.opacity = "1";
                boxRing.style.transform = "scale(1)";
            }, 250);

            // ラベルを選んだ指輪に更新
            if (priceLabel) setPriceText(priceLabel, picked.price);
            if (matLabel) matLabel.textContent = picked.mat;
            if (matEnLabel) matEnLabel.textContent = picked.matEn;

            // 箱の状態を更新
            Object.assign(boxState, {
                src: picked.src, mat: picked.mat, matEn: picked.matEn, price: picked.price,
                name: picked.name, nameJp: picked.nameJp, stone: picked.stone, meta: picked.meta, body: picked.body,
            });

            // カードには元・箱の指輪を戻す（PC版と同じ入れ替え方式）
            if (cardImg) cardImg.src = prevBox.src;
            if (cardMatEl) cardMatEl.textContent = prevBox.mat;
            if (cardPriceEl) setPriceText(cardPriceEl, prevBox.price);
            card.dataset.ringSrc = prevBox.src;
            card.dataset.mat = prevBox.mat;
            card.dataset.matEn = prevBox.matEn;
            card.dataset.price = prevBox.price;
            card.dataset.name = prevBox.name;
            card.dataset.nameJp = prevBox.nameJp;
            card.dataset.stone = prevBox.stone;
            card.dataset.meta = prevBox.meta;
            card.dataset.body = prevBox.body;
        }

        cards.forEach((card) => card.addEventListener("click", (e) => {
            e.preventDefault();
            swapMobile(card);
        }));
    }

    /* ============================================================
       ナビの予約ボタン（スマホ）
       スマホはリングアイコンだけなので、1回目のタップでラベルを見せて、
       もう一度タップ（または外側タップ）したら実際に遷移させる。
       ============================================================ */
    function setupNavCtaTap() {
        const cta = document.querySelector(".nav_cta");
        if (!cta) return;

        cta.addEventListener("click", (e) => {
            if (wide.matches) return; // PCは通常のhoverに任せる
            if (!cta.classList.contains("is_active")) {
                e.preventDefault();
                cta.classList.add("is_active");
            }
        });

        document.addEventListener("click", (e) => {
            if (!cta.contains(e.target)) cta.classList.remove("is_active");
        });
    }

    /* ============================================================
       実行
       ============================================================ */
    setupLoading();
    setupNavCtaTap();

    if (hasGSAP && !reduced) {
        // Craft の pin を先に作る。pin より後ろにある要素（whyus/flow など）の
        // reveal トリガー位置は pin の高さ込みで計算する必要があるため、順番が重要。
        // pin する工程演出はPC幅だけ。スマホは単純に縦並びで表示する。
        if (wide.matches) setupCraft();
        else setupCraftStatic();
        setupReveals();
        if (wide.matches) setupRing(); // 指輪はPC幅だけ
        // フォントや画像が読み終わってから位置を測り直す。
        // Craft の pin 確定で下の要素の位置がズレるため、少し遅らせて再計算する
        window.addEventListener("load", () => {
            ScrollTrigger.refresh();
            setTimeout(() => ScrollTrigger.refresh(), 400);
        });
    } else {
        // GSAPなし／動きを減らす設定のとき
        setupCraftStatic();
        setupReveals();
    }

    // コレクションの指輪入れ替え：PC幅は飛ぶ#ring版、スマホ幅は箱内img版
    if (wide.matches) {
        setupPlistSwap();
    } else {
        setupPlistSwapMobile();
    }
});

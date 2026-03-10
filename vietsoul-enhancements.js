/* ═══════════════════════════════════════════════════════════════
   VIETSOUL ENHANCEMENTS JS — v3 clean + correct
   
   RULES FOLLOWED:
   1. Every window.X patch guarded by a boolean — wraps only ONCE
   2. ink-reveal uses class "vs-ink-reveal" NOT "ink-reveal" to avoid
      clashing with any existing CSS; only applied to JS-rendered cards
   3. texture class "vs-texture" is additive background-image only —
      no ::before, no position changes, no z-index changes
   4. allProductsRef is same array reference as module allProducts —
      .push() mutates it in place; re-render via window.renderHomeProducts
      which is exposed on window inside DOMContentLoaded
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── util ── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  /* ════════════════════════════════════════════════════════════
     2. STORY MODE
  ════════════════════════════════════════════════════════════ */
  const CRAFT_STEPS = {
    default: [
      { n:'Chọn nguyên liệu',      d:'Nghệ nhân tuyển chọn kỹ từng nguyên liệu tự nhiên theo mùa.' },
      { n:'Sơ chế & chuẩn bị',     d:'Nguyên liệu được xử lý thủ công, không dùng hóa chất công nghiệp.' },
      { n:'Tạo hình & chế tác',     d:'Đôi tay nghệ nhân định hình sản phẩm qua nhiều công đoạn tỉ mỉ.' },
      { n:'Hoàn thiện & kiểm tra',  d:'Từng chi tiết được kiểm tra trước khi đến tay khách hàng.' }
    ],
    tranh: [
      { n:'Khắc khuôn gỗ',         d:'Nghệ nhân khắc ngược hoa văn lên gỗ thị — mỗi khuôn mất 2–4 tuần.' },
      { n:'Pha màu từ thảo mộc',    d:'Màu từ lá chàm, cây sơn, vỏ hến — hoàn toàn tự nhiên.' },
      { n:'In thủ công',            d:'Đặt khuôn lên giấy dó, lăn màu đều tay rồi bóc nhẹ nhàng.' },
      { n:'Phơi & đóng gói',        d:'Phơi bóng mát 24 giờ để màu ngấm sâu vào thớ giấy.' }
    ],
    gom: [
      { n:'Lọc & nhào đất sét',     d:'Đất lấy từ bờ sông, lọc qua 3 lớp để loại bỏ tạp chất.' },
      { n:'Tạo hình trên bàn xoay', d:'Đôi tay điêu luyện định hình từng chiếc trong 5–15 phút.' },
      { n:'Tráng men & trang trí',  d:'Vẽ hoa văn rồi nhúng men — men tro tạo màu không lặp lại.' },
      { n:'Nung lò',                d:'Nung ở 1.200°C trong 12–18 giờ. Mỗi mẻ là một cuộc phiêu lưu.' }
    ],
    lua: [
      { n:'Nuôi tằm & ươm tơ',      d:'Từ trứng tằm đến nhộng mất 25 ngày chăm sóc liên tục.' },
      { n:'Xe sợi & mắc go',        d:'Sợi tơ mảnh như tóc được xe đôi rồi mắc vào khung cửi.' },
      { n:'Dệt tay',                d:'Một người thợ dệt được 3–4m vải mỗi ngày.' },
      { n:'Nhuộm & giặt tự nhiên',  d:'Nhuộm chàm, củ nâu hoặc vỏ cây — không thải hóa chất.' }
    ]
  };

  function buildStoryHTML(p) {
    const steps = CRAFT_STEPS[p.category] || CRAFT_STEPS.default;
    const stepsHTML = steps.map((s, i) => `
      <div class="timeline-step">
        <div class="timeline-dot">${i+1}</div>
        <div class="timeline-content"><strong>${s.n}</strong><span>${s.d}</span></div>
      </div>${i < steps.length-1 ? '<div class="timeline-line"></div>' : ''}`).join('');
    const tagsHTML = (p.tags||[]).map(t => `<span class="story-green-tag">🌿 ${t}</span>`).join('');
    return `
      <div class="story-hero-overlay">
        <img class="story-hero" src="${p.img}" onerror="this.src='${p.fallback}'" alt="${p.name}">
      </div>
      <div class="story-body">
        <div class="story-tag">VietSoul · Câu Chuyện Nghệ Nhân</div>
        <div class="story-title">${p.name}</div>
        <div class="story-artist">✦ ${p.artist} — ${p.location}</div>
        <p class="story-text">"${p.story||'Mỗi sản phẩm là tác phẩm của đôi tay và tâm huyết nghệ nhân.'}"</p>
        <div class="story-timeline">
          <div class="story-timeline-title">Quy trình chế tác</div>
          ${stepsHTML}
        </div>
        ${tagsHTML ? `<div class="story-timeline-title" style="margin-bottom:10px;">Cam kết xanh</div><div class="story-green-tags">${tagsHTML}</div>` : ''}
      </div>`;
  }

  function initStoryOverlay() {
    if (document.getElementById('story-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'story-overlay';
    ov.innerHTML = `<div id="story-panel"><button id="story-close">✕</button><div id="story-content"></div></div>`;
    document.body.appendChild(ov);
    document.getElementById('story-close').addEventListener('click', closeStory);
    ov.addEventListener('click', e => { if (e.target === ov) closeStory(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeStory(); });
    window.openStoryMode = function(id) {
      const p = (window.allProductsRef||[]).find(x => x.id === id);
      if (!p) return;
      document.getElementById('story-content').innerHTML = buildStoryHTML(p);
      ov.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
  }
  function closeStory() {
    const ov = document.getElementById('story-overlay');
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
  }


  /* ════════════════════════════════════════════════════════════
     REVIEWS DATA — seeded per product category + pool of names
  ════════════════════════════════════════════════════════════ */
  const REVIEW_POOL = {
    tranh: [
      { name:'Nguyễn Thị Mai',    loc:'Hà Nội',   stars:5, text:'Tranh rất đẹp, màu sắc tươi sáng hơn ảnh nhiều. Đóng gói cẩn thận, giao nhanh. Mình sẽ quay lại mua tiếp!', date:'12/03/2025' },
      { name:'Trần Văn Khoa',     loc:'TP.HCM',   stars:5, text:'Mua tặng bố, ông rất thích. Nét khắc tinh xảo, giấy dó thật sự mịn và bền. Xứng đáng 5 sao.', date:'28/02/2025' },
      { name:'Lê Phương Anh',     loc:'Đà Nẵng',  stars:4, text:'Sản phẩm đúng mô tả, chất lượng tốt. Chỉ cần đóng gói thêm một lớp bảo vệ nữa là hoàn hảo.', date:'05/01/2025' },
    ],
    lua: [
      { name:'Phạm Minh Châu',    loc:'Hà Nội',   stars:5, text:'Lụa mềm mại, màu sắc đẹp không bị loang. Mặc vào rất mát và thoáng. Cực kỳ hài lòng!', date:'18/04/2025' },
      { name:'Đỗ Thị Hương',      loc:'Cần Thơ',  stars:5, text:'Mua khăn lụa tặng mẹ nhân ngày 20/10, mẹ mình thích lắm. Chất vải thật sự khác hoàn toàn với hàng chợ.', date:'20/10/2024' },
      { name:'Vũ Thành Nam',      loc:'Huế',      stars:4, text:'Vải dệt tay rõ nét, hoa văn đẹp. Màu sắc bền, giặt 3 lần không phai. Đóng gói bằng giấy kraft rất sang.', date:'07/03/2025' },
    ],
    gom: [
      { name:'Hoàng Thị Lan',     loc:'Hải Phòng',stars:5, text:'Gốm đẹp hơn ảnh rất nhiều! Men bóng đều, không có bong tróc. Dùng pha trà rất thú vị, hương trà thơm hơn hẳn.', date:'15/05/2025' },
      { name:'Ngô Văn Tùng',      loc:'Hà Nội',   stars:5, text:'Mua bộ ấm chén cho văn phòng, đồng nghiệp ai cũng khen. Chất lượng xứng đáng với giá tiền.', date:'02/04/2025' },
      { name:'Bùi Thị Ngọc',      loc:'Quảng Nam',stars:4, text:'Sản phẩm đẹp, giao hàng đúng hẹn. Mình thích cái cách shop đóng gói bằng rơm tự nhiên, rất thân thiện môi trường.', date:'19/02/2025' },
    ],
    gift: [
      { name:'Trịnh Hải Yến',     loc:'TP.HCM',   stars:5, text:'Mua làm quà công ty, ban giám đốc rất ấn tượng. Quà tặng vừa ý nghĩa vừa độc đáo, không đâu có hàng như thế này.', date:'08/04/2025' },
      { name:'Đinh Quốc Bảo',     loc:'Hà Nội',   stars:5, text:'Mua tặng đối tác nước ngoài, họ thích lắm và hỏi mua thêm. Đây đúng là loại quà đại diện cho văn hóa Việt.', date:'14/03/2025' },
      { name:'Lý Thị Thu Thảo',   loc:'Đà Lạt',   stars:5, text:'Sản phẩm tinh tế, màu sắc đẹp. Giao hàng cẩn thận, hộp đựng sang trọng. Sẽ mua lại cho mùa Tết.', date:'29/01/2025' },
    ],
    dotuong: [
      { name:'Phùng Văn Đức',     loc:'Huế',      stars:5, text:'Tượng được chạm khắc rất tỉ mỉ, gỗ thơm và chắc chắn. Đặt trên bàn thờ rất uy nghiêm. Cảm ơn nghệ nhân!', date:'22/03/2025' },
      { name:'Nguyễn Mỹ Linh',    loc:'Hà Nội',   stars:5, text:'Mua làm quà tặng ông nội, ông rất xúc động. Sản phẩm có tâm, làm đúng theo truyền thống, không qua loa như nhiều nơi khác.', date:'10/02/2025' },
      { name:'Cao Thị Thanh Nga',  loc:'Bình Định',stars:4, text:'Đường nét chạm khắc sắc nét, bề mặt gỗ được xử lý kỹ. Màu sơn tự nhiên, không bị bay mùi. Rất hài lòng.', date:'05/05/2025' },
    ],
    default: [
      { name:'Lê Thị Bình',       loc:'Hà Nội',   stars:5, text:'Sản phẩm rất đẹp, chất lượng vượt mong đợi. Đóng gói cẩn thận, giao hàng đúng hẹn. Sẽ giới thiệu cho bạn bè!', date:'01/04/2025' },
      { name:'Nguyễn Thanh Tùng', loc:'TP.HCM',   stars:5, text:'Hàng thủ công thật sự khác biệt so với hàng công nghiệp. Cảm nhận được sự tâm huyết của nghệ nhân trong từng sản phẩm.', date:'15/03/2025' },
      { name:'Trần Ngọc Hà',      loc:'Đà Nẵng',  stars:4, text:'Sản phẩm tốt, nhìn thấy rõ nét thủ công qua từng chi tiết. Giá hợp lý so với chất lượng. Mình mua lần này là lần thứ 3 rồi.', date:'20/02/2025' },
    ]
  };

  // Ratings distribution per category (5★ to 1★)
  const RATING_DIST = {
    tranh:   [68,22,7,2,1], lua:    [72,18,6,3,1],
    gom:     [75,16,6,2,1], gift:   [70,20,6,3,1],
    dotuong: [73,18,6,2,1], default:[69,20,7,3,1]
  };

  function buildReviewsHTML(p) {
    const reviews = REVIEW_POOL[p.category] || REVIEW_POOL.default;
    const dist    = RATING_DIST[p.category]  || RATING_DIST.default;
    const total   = parseInt(String(p.sold||'0').replace(/[K.]/g,'')) || 300;
    const reviewCount = Math.min(total, 480) + Math.floor(Math.random()*40);
    const avg     = (4.6 + Math.random()*0.3).toFixed(1);

    const barsHTML = [5,4,3,2,1].map((star,i) => {
      const pct = dist[i];
      return `<div class="vs-review-bar-row">
        <span class="vs-review-bar-label">${star}★</span>
        <div class="vs-review-bar-track"><div class="vs-review-bar-fill" style="width:${pct}%"></div></div>
        <span class="vs-review-bar-count">${pct}%</span>
      </div>`;
    }).join('');

    const starsStr = n => '★'.repeat(n) + '☆'.repeat(5-n);

    const cardsHTML = reviews.map(r => `
      <div class="vs-review-card">
        <div class="vs-review-header">
          <div>
            <span class="vs-review-name">${r.name}</span>
            <span class="vs-review-location">· ${r.loc}</span>
            <span class="vs-review-verified">✓ Đã mua</span>
          </div>
          <span class="vs-review-stars">${starsStr(r.stars)}</span>
        </div>
        <div class="vs-review-text">${r.text}</div>
        <div class="vs-review-date">${r.date}</div>
      </div>`).join('');

    return `
      <div id="vs-reviews">
        <div class="vs-reviews-title">Đánh giá từ khách hàng đã mua</div>
        <div class="vs-review-summary">
          <div>
            <div class="vs-review-avg">${avg}</div>
            <div style="color:#C8960C;font-size:13px;margin:2px 0;">★★★★★</div>
            <div class="vs-review-avg-label">${reviewCount.toLocaleString('vi')} đánh giá</div>
          </div>
          <div class="vs-review-bar">${barsHTML}</div>
        </div>
        ${cardsHTML}
      </div>`;
  }

  /* Patch openProductDetail — guarded, wraps ONCE only */
  let _pdPatchDone = false;
  function patchProductDetail() {
    if (_pdPatchDone) return;
    if (typeof window.openProductDetail !== 'function') { setTimeout(patchProductDetail, 150); return; }
    _pdPatchDone = true;
    const orig = window.openProductDetail;
    window.openProductDetail = function(id) {
      orig(id);
      setTimeout(() => {
        const p = (window.allProductsRef||[]).find(x => x.id === id);

        // Remove any leftover story buttons from previous product
        document.querySelectorAll('.btn-story-mode').forEach(b => b.remove());
        const summary = document.getElementById('product-summary');
        if (!summary) return;

        // Inject story button
        const btn = document.createElement('button');
        btn.className = 'btn-story-mode';
        btn.innerHTML = '📖 Câu chuyện sản phẩm';
        btn.onclick = () => window.openStoryMode(id);
        summary.parentNode.insertBefore(btn, summary.nextSibling);

        // Inject reviews into tab-story section
        if (p) {
          const storyTab = document.getElementById('tab-story');
          if (storyTab) {
            // Remove old reviews first
            const oldRev = storyTab.querySelector('#vs-reviews');
            if (oldRev) oldRev.remove();
            storyTab.insertAdjacentHTML('beforeend', buildReviewsHTML(p));
          }
        }
      }, 120);
    };
  }

  /* ════════════════════════════════════════════════════════════
     3. DIGITAL CERTIFICATE
  ════════════════════════════════════════════════════════════ */
  function initCertificate() {
    if (document.getElementById('cert-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'cert-overlay';
    ov.innerHTML = `
      <div id="cert-card">
        <div class="cert-bg">
          <div class="cert-frame">
            <div class="cert-header">
              <div class="cert-seal">🎋</div>
              <div class="cert-pre-title">VietSoul · Giấy Chứng Nhận</div>
              <div class="cert-main-title">Di sản Việt Nam</div>
              <div class="cert-divider"></div>
            </div>
            <div id="cert-body-content" class="cert-body"></div>
            <div class="cert-footer">
              <div class="cert-qr">⭐</div>
              <div class="cert-sign">
                <span class="cert-sign-name">VietSoul</span>
                <span class="cert-sign-role">Xác nhận chính thống</span>
              </div>
            </div>
          </div>
        </div>
        <div class="cert-actions">
          <button class="cert-btn cert-btn-secondary" id="cert-close-btn">Đóng</button>
          <button class="cert-btn cert-btn-primary" id="cert-share-btn">📸 Lưu ảnh</button>
          <button class="cert-btn cert-btn-primary" id="cert-home-btn">🏠 Trang chủ</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById('cert-close-btn').addEventListener('click', closeCert);
    ov.addEventListener('click', e => { if (e.target === ov) closeCert(); });
    document.getElementById('cert-share-btn').addEventListener('click', () => {
      alert('💡 Dùng tính năng chụp màn hình (Ctrl+Shift+S hoặc PrtScn) để lưu chứng chỉ!');
    });
    document.getElementById('cert-home-btn').addEventListener('click', () => {
      closeCert();
      if (typeof window.showPage === 'function') window.showPage('home');
    });
    window.showCertificate = function(data) {
      const { orderId, items, total, customerName } = data;
      const product = items && items[0] && window.allProductsRef
        ? window.allProductsRef.find(p => p.id === (items[0].id || items[0]))
        : null;
      const dateStr = new Date().toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
      document.getElementById('cert-body-content').innerHTML = `
        <div class="cert-row"><span class="cert-label">Mã đơn hàng</span><span class="cert-value highlight">#${orderId}</span></div>
        <div class="cert-row"><span class="cert-label">Khách hàng</span><span class="cert-value">${customerName||'Quý khách VietSoul'}</span></div>
        ${product ? `
          <div class="cert-row"><span class="cert-label">Sản phẩm</span><span class="cert-value">${product.name}</span></div>
          <div class="cert-row"><span class="cert-label">Nghệ nhân</span><span class="cert-value highlight">${product.artist}</span></div>
          <div class="cert-row"><span class="cert-label">Vùng sản xuất</span><span class="cert-value">${product.location}</span></div>
        ` : `<div class="cert-row"><span class="cert-label">Số sản phẩm</span><span class="cert-value">${items?items.length:0} sản phẩm</span></div>`}
        <div class="cert-row"><span class="cert-label">Tổng giá trị</span><span class="cert-value highlight">${total||'—'} ₫</span></div>
        <div class="cert-row"><span class="cert-label">Ngày xác nhận</span><span class="cert-value">${dateStr}</span></div>
        <div class="cert-row"><span class="cert-label">Cam kết</span><span class="cert-value" style="color:#2e7d32">🌿 Sản phẩm thủ công chính gốc</span></div>`;
      ov.classList.add('open');
    };
  }
  function closeCert() {
    const ov = document.getElementById('cert-overlay');
    if (ov) ov.classList.remove('open');
  }

  let _orderPatchDone = false;
  function patchPlaceOrder() {
    if (_orderPatchDone) return;
    if (typeof window.placeOrder !== 'function') { setTimeout(patchPlaceOrder, 200); return; }
    _orderPatchDone = true;
    const orig = window.placeOrder;
    window.placeOrder = function() {
      orig();
      setTimeout(() => {
        const nameEl  = document.getElementById('ck-name');
        const totalEl = document.getElementById('ck-total');
        const items   = window.cartItems ? [...window.cartItems] : [];
        const orderId = 'VS' + Date.now().toString().slice(-6);
        setTimeout(() => {
          if (window.showCertificate) window.showCertificate({
            orderId, items, total: totalEl ? totalEl.textContent : '', customerName: nameEl ? nameEl.value : ''
          });
        }, 800);
      }, 200);
    };
  }


  /* ════════════════════════════════════════════════════════════
     5. HERO WARM TINT (very subtle, no layout change)
  ════════════════════════════════════════════════════════════ */
  function applyWarmTint() {
    const tints = [
      'linear-gradient(160deg,rgba(255,140,50,.09) 0%,rgba(139,0,0,.11) 100%)',
      'linear-gradient(160deg,rgba(180,60,0,.07) 0%,rgba(90,0,40,.09) 100%)',
      'linear-gradient(160deg,rgba(200,130,0,.07) 0%,rgba(139,0,0,.09) 100%)'
    ];
    document.querySelectorAll('#home-page > section:first-child a.relative').forEach((banner, i) => {
      if (banner.querySelector('.vs-warm-layer')) return;
      const layer = document.createElement('div');
      layer.className = 'vs-warm-layer';
      layer.style.background = tints[i % 3];
      banner.appendChild(layer);
    });
  }

  /* ════════════════════════════════════════════════════════════
     6. MARQUEE
  ════════════════════════════════════════════════════════════ */
  const MARQUEE_ITEMS = ['Bát Tràng','Vạn Phúc','Kim Bồng','Làng Sình','Đồng Kỵ','Thanh Tiên','Phù Lãng','Bao La','Xuân La','Chu Đậu','Mù Cang Chải','A Lưới','Đông Triều','Tây Hồ','Thuận Hóa'];
  function injectMarquee() {
    if (document.getElementById('vs-marquee')) return;
    const hero = document.querySelector('#home-page > section:first-child');
    if (!hero) return;
    const track = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map(n => `<span class="marquee-item">${n}</span>`).join('');
    const strip = document.createElement('div');
    strip.id = 'vs-marquee'; strip.className = 'marquee-strip';
    strip.innerHTML = `<div class="marquee-track">${track}</div>`;
    hero.insertAdjacentElement('afterend', strip);
  }

  /* ════════════════════════════════════════════════════════════
     7. INK REVEAL — SAFE VERSION
     
     KEY RULE: Only observe cards that were injected via JS renders
     (bestseller-grid and featured-products-grid). Static HTML cards
     in section-gifts are pre-rendered and must NOT get .vs-ink-reveal.
     
     We add .vs-ink-reveal to a card only AFTER it's inserted into
     a dynamic grid. We do this via MutationObserver on those grids.
     The IntersectionObserver then triggers .vs-ink-visible.
  ════════════════════════════════════════════════════════════ */
  function initInkReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vs-ink-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -10px 0px' });

    // Only watch these two dynamic grids — NOT static HTML anywhere else
    const DYNAMIC_GRIDS = ['bestseller-grid', 'featured-products-grid', 'marketplace-grid'];

    function attachToGrid(gridId) {
      const grid = document.getElementById(gridId);
      if (!grid) return;
      new MutationObserver(mutations => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            // Observe new cards
            if (!node.classList.contains('vs-ink-reveal')) {
              node.classList.add('vs-ink-reveal');
              io.observe(node);
            }
          });
        });
      }).observe(grid, { childList: true });
    }

    DYNAMIC_GRIDS.forEach(attachToGrid);
    window._vsReobserve = () => DYNAMIC_GRIDS.forEach(attachToGrid);
  }

  /* ════════════════════════════════════════════════════════════
     8. MAGAZINE REGION PANEL
  ════════════════════════════════════════════════════════════ */
  const REGION_DATA = {
    bac:       { name:'Miền Bắc',   emoji:'🌲', color:'1b5e20', img:'https://puluongexcursions.com/wp-content/uploads/2023/03/image5-16.png',                    quote:'"Hà Nội 36 phố phường — nơi mỗi con phố là một nghề thủ công."',           villages:['Bát Tràng','Vạn Phúc','Đồng Kỵ','Xuân La','Chu Đậu','Phù Lãng'], locations:['Hà Nội','Bắc Ninh','Hải Dương','Hà Giang','Yên Bái','Quảng Ninh'] },
    trung:     { name:'Miền Trung', emoji:'☀️', color:'7a5c00', img:'https://dulich3mien.vn/wp-content/uploads/2022/07/Du-lich-mien-Trung-8.jpg',                quote:'"Hội An — ánh đèn lồng và linh hồn làng nghề còn nguyên vẹn nhất."',        villages:['Làng Sình','Kim Bồng','Thanh Hà','Tây Hồ','Thuận Hóa'],               locations:['Huế','Đà Nẵng','Hội An','Quảng Nam'] },
    taynguyen: { name:'Tây Nguyên', emoji:'🏔️', color:'7a2500', img:'https://datviettour.com.vn/uploads/images/tin-tuc/Tin-mo-ta-danh-muc-tour/tay-nguyen/Tay-nguyen-1.jpg',  quote:'"Cao nguyên đất đỏ — thổ cẩm kể chuyện đại ngàn qua từng sợi chỉ."',        villages:['Buôn Ma Thuột','Pleiku','Kon Tum','A Lưới'],                            locations:['Gia Lai','Đắk Lắk','Lâm Đồng','A Lưới, Huế'] },
    nam:       { name:'Miền Nam',   emoji:'🌊', color:'6a0026', img:'https://media.vneconomy.vn/images/upload/2021/07/09/tp-hcm.jpeg', quote:'"Sông nước đồng bằng — nơi lá buông dệt thành túi, lục bình thành đệm."', villages:['Bao La','Đồng Tháp','An Giang','Bến Tre'],                              locations:['TP.HCM','Cần Thơ','An Giang','Đồng Tháp'] }
  };

  function buildMagPanel(key) {
    const r = REGION_DATA[key];
    if (!r) return '';
    const prods = (window.allProductsRef || [])
      .filter(p => r.locations.some(l => p.location && p.location.includes(l.split(',')[0].trim())))
      .slice(0, 6);
    const pg = prods.map(p => `
      <div class="mag-product-card" onclick="window.openProductDetail&&window.openProductDetail(${p.id})">
        <img class="mag-product-img" src="${p.img}" onerror="this.src='${p.fallback}'" alt="${p.name}">
        <div class="mag-product-info">
          <div class="mag-product-name">${p.name}</div>
          <div class="mag-product-price">${p.price}₫</div>
        </div>
      </div>`).join('');
    const vg = r.villages.map(v => `<span class="mag-village-tag">🏘 ${v}</span>`).join('');
    return `
      <div class="mag-panel">
        <div class="mag-hero">
          <img src="${r.img}" onerror="this.src='https://placehold.co/640x200/${r.color}/fff?text=${encodeURIComponent(r.name)}'" alt="${r.name}">
          <div class="mag-hero-overlay" style="background:linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 60%)">
            <div class="mag-region-name">${r.emoji} ${r.name}</div>
            <div class="mag-pull-quote">${r.quote}</div>
          </div>
        </div>
        <div class="mag-body">
          <div class="mag-section-label">Làng nghề nổi tiếng</div>
          <div class="mag-villages">${vg}</div>
          <div class="mag-section-label">Sản phẩm đặc trưng</div>
          <div class="mag-product-grid">${pg || '<p style="font-size:11px;color:#9a7a60;grid-column:1/-1">Đang cập nhật...</p>'}</div>
          <button class="mag-view-all" onclick="window.showPage&&window.showPage('products')">Xem tất cả sản phẩm ${r.name} →</button>
        </div>
      </div>`;
  }

  let _selPatch = false;
  function patchSelectRegion() {
    if (_selPatch) return;
    if (typeof window.selectRegion !== 'function') { setTimeout(patchSelectRegion, 300); return; }
    _selPatch = true;
    const orig = window.selectRegion;
    window.selectRegion = function(key) {
      // 1. Run original — fills map-region-name, map-products-grid, map-view-all-btn, etc.
      orig(key);

      // 2. Inject magazine hero image into existing header (non-destructive)
      const r = REGION_DATA[key];
      if (!r) return;

      // Remove previous injected hero if switching regions
      const prev = document.getElementById('vs-mag-hero');
      if (prev) prev.remove();

      const header = document.getElementById('map-region-header');
      if (!header) return;

      const hero = document.createElement('div');
      hero.id = 'vs-mag-hero';
      hero.style.cssText = [
        'position:relative', 'overflow:hidden', 'height:150px',
        'margin:-24px -24px 16px', 'flex-shrink:0'
      ].join(';');
      const fallbackUrl = 'https://placehold.co/640x150/' + r.color + '/fff?text=' + encodeURIComponent(r.name);
      hero.innerHTML = `
        <img src="${r.img}" onerror="this.src='${fallbackUrl}'" alt="${r.name}"
          style="width:100%;height:100%;object-fit:cover;display:block;">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.65) 0%,transparent 55%);
          display:flex;align-items:flex-end;padding:12px 16px;">
          <span style="font-family:'SVN Agency FB','Playfair Display',serif;font-size:26px;font-weight:900;
            color:white;text-transform:uppercase;text-shadow:0 2px 10px rgba(0,0,0,.5);">
            ${r.emoji} ${r.name}
          </span>
        </div>`;

      // Insert hero at very top of header
      header.insertBefore(hero, header.firstChild);

      // Style the description as a pull-quote
      const desc = document.getElementById('map-region-desc');
      if (desc && r.quote) {
        desc.textContent = r.quote.replace(/[\u201c\u201d""]/g, '');
        desc.style.fontStyle = 'italic';
        desc.style.color = '#7a5c44';
        desc.style.fontSize = '11px';
      }
    };
  }

  /* ════════════════════════════════════════════════════════════
     INIT — everything in one place
  ════════════════════════════════════════════════════════════ */
  ready(function() {
    // 1. DOM overlays — idempotent
    initStoryOverlay();
    initCertificate();

    // 2. Visual — no side effects
    applyWarmTint();
    injectMarquee();
    initInkReveal();

    // 4. Function patches — all guarded, run after module scripts
    setTimeout(() => {
      patchProductDetail();
      patchPlaceOrder();
      patchSelectRegion();
    }, 600);

    // 5. Patch showPage to re-observe on page switches
    //    (guarded: only wrap once via closure check)
    const origSP = window.showPage;
    if (typeof origSP === 'function' && !origSP._vsPatched) {
      window.showPage = function(pid) {
        origSP(pid);
        if (pid === 'products' || pid === 'home') {
          setTimeout(() => window._vsReobserve && window._vsReobserve(), 200);
        }
      };
      window.showPage._vsPatched = true;
    }
  });

})();
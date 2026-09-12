fetch('header.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('header_placeholder').innerHTML = html;

    // fetchで埋め込んだ後にJSを実行
    const hamburger = document.querySelector('.hamburger-morph');
    const nav = document.querySelector('.nav-morph');

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      nav.classList.toggle('active');
      const isOpen = hamburger.classList.contains('active');
      hamburger.setAttribute('aria-expanded', isOpen);
      nav.setAttribute('aria-hidden', !isOpen);
      if (isOpen) {
        document.body.classList.add('menu-open');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
      }
    });

    const menuLinks = document.querySelectorAll('.nav-morph__link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', false);
        nav.setAttribute('aria-hidden', true);
      });
    });

    // ログイン済みならアカウントアイコンを mypage へ
    if (sessionStorage.getItem('selectLoggedIn')) {
      document.querySelectorAll('a[href="login.html"]').forEach(a => {
        a.href = 'mypage.html';
      });
    }
  });
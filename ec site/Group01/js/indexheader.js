function setupHeaderLogic() {
const header = document.querySelector('header');
if (!header) return; // ヘッダーがない場合は終了


const themeSections = document.querySelectorAll('section[data-theme]');


function updateHeader() {
    let currentTheme = null;
    const headerHeight = 30;


    themeSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= headerHeight && rect.bottom > headerHeight) {
            currentTheme = section.getAttribute('data-theme');
        }
    });


    if (currentTheme === 'light') {
        header.classList.add('is-scrolled', 'theme-light');
        header.classList.remove('theme-dark');
    } else if (currentTheme === 'dark') {
        header.classList.add('is-scrolled', 'theme-dark');
        header.classList.remove('theme-light');
    } else {
        // heroheader（テーマなし）
        header.classList.remove('is-scrolled', 'theme-light', 'theme-dark');
    }
}


window.addEventListener('scroll', updateHeader);
updateHeader(); // 初回判定
}


fetch("footer_common.html")
.then((response) => response.text())
.then((data) => document.querySelector("#footer").innerHTML = data);

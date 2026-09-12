document.addEventListener("DOMContentLoaded", () => {
    const frame = document.querySelector(".SLU_product_img_frame");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const scrollAmount = 500; 
    const updateButtons = () => {
        const scrollLeft = frame.scrollLeft;
        const maxScrollLeft = frame.scrollWidth - frame.clientWidth;
        prevBtn.disabled = scrollLeft <= 0;
        nextBtn.disabled = scrollLeft >= maxScrollLeft - 1;
    };
    nextBtn.addEventListener("click", () => {
        frame.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
    prevBtn.addEventListener("click", () => {
        frame.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    frame.addEventListener("scroll", updateButtons);
    updateButtons();
    window.addEventListener("resize", updateButtons);
});
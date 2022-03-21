// typed Animation script
var typed = new Typed(".typing", {
    strings: ["YouTuber", "Developer", "Bloger", "Designer", "Freelancer"],
    typeSpeed: 100,
    backSpeed: 60,
    loop: true
});

window.addEventListener("scroll", function() {
    var nav = document.getElementById("nav");
    nav.classList.toggle("sticky", window.scrollY > 0)


})
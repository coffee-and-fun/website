// The pet cat, the app's actual sprite sheet. She walks in along the
// bottom of the viewport, sits down (all motion finishes inside 5s,
// WCAG 2.2.2), and runs away if your cursor gets too close. Purely
// decorative: aria-hidden, skipped entirely under reduced motion.
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var FW = 96;
    var ANIM = {
        walk: { y: 576, n: 8, ms: 120 },
        idle: { y: 384, n: 8, ms: 200 },
        sit:  { y: 192, n: 8, ms: 250 },
        run:  { y: 1056, n: 4, ms: 80 }
    };
    var img = new Image();
    var el, ctx, animInt, moveTimer, x, gone = false;

    img.onload = function () { setTimeout(start, 2200); };
    if (document.readyState === 'complete') img.src = '/assets/images/apps/markdown-editor-cat.png';
    else window.addEventListener('load', function () { img.src = '/assets/images/apps/markdown-editor-cat.png'; });

    function drawFrame(y, f) { ctx.clearRect(0, 0, FW, FW); ctx.drawImage(img, f * FW, y, FW, FW, 0, 0, FW, FW); }
    function stopAnim() { if (animInt) clearInterval(animInt); animInt = null; }
    function play(name) {
        stopAnim();
        var a = ANIM[name], f = 0;
        drawFrame(a.y, 0);
        animInt = setInterval(function () { f = (f + 1) % a.n; drawFrame(a.y, f); }, a.ms);
    }

    function start() {
        el = document.createElement('div');
        el.setAttribute('aria-hidden', 'true');
        el.style.cssText = 'position:fixed;bottom:0;left:0;width:96px;height:96px;z-index:60;cursor:pointer;user-select:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));';
        var c = document.createElement('canvas');
        c.width = FW; c.height = FW;
        c.style.cssText = 'width:96px;height:96px;image-rendering:pixelated;';
        ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        el.appendChild(c);
        document.body.appendChild(el);

        x = -100;
        el.style.transform = 'translateX(' + x + 'px)';
        play('walk');
        var target = Math.min(window.innerWidth * 0.16, 260);
        moveTimer = setInterval(function () {
            x += 4.5;
            el.style.transform = 'translateX(' + x + 'px)';
            if (x >= target) {
                clearInterval(moveTimer);
                play('idle');
                setTimeout(function () { if (!gone) { stopAnim(); drawFrame(ANIM.sit.y, 0); } }, 1600);
            }
        }, 40);

        el.addEventListener('click', flee);
        el.addEventListener('touchstart', flee, { passive: true });
        document.addEventListener('mousemove', onMove, { passive: true });
    }

    function onMove(e) {
        if (gone || !el) return;
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + FW / 2), dy = e.clientY - (r.top + FW / 2);
        if (dx * dx + dy * dy < 150 * 150) flee();
    }

    function flee() {
        if (gone) return;
        gone = true;
        document.removeEventListener('mousemove', onMove);
        clearInterval(moveTimer);
        play('run');
        var runTimer = setInterval(function () {
            x += 14;
            el.style.transform = 'translateX(' + x + 'px)';
            if (x > window.innerWidth + 120) {
                clearInterval(runTimer);
                stopAnim();
                el.remove();
                el = null;
            }
        }, 16);
    }
})();

// Scroll-reveal for cards; shows everything instantly if reduced motion is on.
(function () {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(function (el) { el.classList.add('revealed'); });
        return;
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                io.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
})();

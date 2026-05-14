const DB = [
    { id: 1, title: "QUANTUM_SCRAPER", lang: "Python", diff: "Advanced", info: "High-concurrency data harvesting engine." },
    { id: 2, title: "VOID_SHELL", lang: "Rust", diff: "Advanced", info: "Unix-based memory-safe terminal implementation." },
    { id: 3, title: "NEO_CORE", lang: "Go", diff: "Beginner", desc: "Minimalist microservice boilerplate." },
    { id: 4, title: "NIGHT_VISION", lang: "JavaScript", diff: "Advanced", info: "Real-time edge detection via WebCam." }
];

let currentFilters = { lang: 'All', diff: 'All' };

function nav(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.style.opacity = '0';
        setTimeout(() => s.classList.remove('active'), 300);
    });
    
    setTimeout(() => {
        const next = document.getElementById(id);
        next.classList.add('active');
        setTimeout(() => next.style.opacity = '1', 50);
        if(id === 'explorer') render();
    }, 400);
}

function setFilter(type, value, el) {
    currentFilters[type] = value;
    
    // UI selection visual
    el.parentElement.querySelectorAll('li').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    
    render();
}

function render() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';

    const results = DB.filter(p => {
        return (currentFilters.lang === 'All' || p.lang === currentFilters.lang) &&
               (currentFilters.diff === 'All' || p.diff === currentFilters.diff);
    });

    results.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="font-family:monospace; color:rgba(255,255,255,0.4); font-size:10px; margin-bottom:1rem;">
                ${p.lang} // ${p.diff.toUpperCase()}
            </div>
            <h3 style="letter-spacing:-1px; margin:0 0 10px 0;">${p.title}</h3>
            <p style="font-size:13px; color:rgba(255,255,255,0.6); line-height:1.5;">${p.info || "No data provided for this module."}</p>
        `;
        grid.appendChild(card);
    });
}
const projectData = [
    { title: "PY_SCRAPER", lang: "Python", diff: "Advanced", desc: "Automated engine for extracting high-volume financial data." },
    { title: "RUST_FS", lang: "Rust", diff: "Advanced", desc: "Custom file system implementation focusing on safety and speed." },
    { title: "GOLANG_API", lang: "Go", diff: "Beginner", desc: "Minimalist REST layer for cloud-native applications." },
    { title: "NODE_DASH", lang: "JavaScript", diff: "Advanced", desc: "Real-time visualization of server-side metrics." },
    { title: "CSS_ARCH", lang: "HTML", diff: "Beginner", desc: "Design system architecture for enterprise platforms." },
    { title: "JAVA_CORE", lang: "Java", diff: "Advanced", desc: "Distributed system logic for high-concurrency environments." }
];

let filters = { lang: 'All', diff: 'All' };

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
    filters[type] = value;
    el.parentElement.querySelectorAll('li').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    render();
}

function render() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';

    const filtered = projectData.filter(p => {
        const l = filters.lang === 'All' || p.lang === filters.lang;
        const d = filters.diff === 'All' || p.diff === filters.diff;
        return l && d;
    });

    filtered.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.transitionDelay = `${i * 0.05}s`;
        card.innerHTML = `
            <div style="font-size:10px; font-weight:900; margin-bottom:1rem; color:#888;">
                ${p.lang.toUpperCase()} // ${p.diff.toUpperCase()}
            </div>
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
        `;
        grid.appendChild(card);
    });
}
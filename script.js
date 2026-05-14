const projectData = [
    { title: "Automation Bot", lang: "Python", diff: "Beginner", desc: "A simple bot to organize your workspace files automatically." },
    { title: "Advanced ML Model", lang: "Python", diff: "Advanced", desc: "Predictive analysis using specialized datasets." },
    { title: "Enterprise CRM", lang: "Java", diff: "Advanced", desc: "A robust client management system for high-scale businesses." },
    { title: "Pixel Portfolio", lang: "HTML", diff: "Beginner", desc: "A pixel-perfect landing page focused on typography." },
    { title: "Realtime Chat", lang: "JavaScript", diff: "Advanced", desc: "Using WebSockets for instant global messaging." },
    { title: "Network Proxy", lang: "Go", diff: "Advanced", desc: "Efficient load balancer for high-traffic servers." },
    { title: "Kernel Tool", lang: "Rust", diff: "Advanced", desc: "Low-level system utility for memory management." },
    { title: "ToDo Pro", lang: "JavaScript", diff: "Beginner", desc: "Interactive task manager with local storage." }
];

let filters = { lang: 'All', diff: 'All' };

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    setTimeout(() => {
        const target = document.getElementById(pageId);
        target.classList.add('active');
        if(pageId === 'explorer') render();
    }, 100);
}

function setFilter(type, value, btn) {
    // Update State
    if (type === 'lang') filters.lang = value;
    else filters.diff = value;

    // Update UI Buttons
    btn.parentElement.querySelectorAll('.tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    render();
}

function render() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';

    const filtered = projectData.filter(p => {
        const langMatch = filters.lang === 'All' || p.lang === filters.lang;
        const diffMatch = filters.diff === 'All' || p.diff === filters.diff;
        return langMatch && diffMatch;
    });

    filtered.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span style="font-size:0.8rem; color:#888; font-weight:700;">${p.lang} // ${p.diff}</span>
            <h3 style="margin: 15px 0 10px 0; font-size:1.5rem;">${p.title}</h3>
            <p style="line-height:1.6; color:#444;">${p.desc}</p>
        `;
        grid.appendChild(card);
        
        // Staggered entrance effect
        setTimeout(() => card.classList.add('show'), index * 100);
    });
}

// Initial Landing Animation
window.onload = () => {
    console.log("Be Ahead Loaded Successfully.");
};
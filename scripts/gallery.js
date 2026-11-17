const SKETCHES = new Set(['gizmos', 'rings', 'randoms', 'dfs', 'substrate/base', 'substrate/circles']);
// Load only known sketches; p5 consumes their global setup/draw callbacks.
const sketchPath = window.location.pathname.replace(/^\/|\/$/g, '');

if (SKETCHES.has(sketchPath)) {
    const script = document.createElement('script');
    script.src = `/sketches/${sketchPath}.js`;

    console.log(`${script.src}`);

    script.onerror = () => {
        document.body.innerHTML = `<h2>Sketch not found: ${sketchPath}</h2>`;
    };

    document.body.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = 'Download';
    btn.onclick = download;
    document.body.appendChild(script);
    document.body.appendChild(btn);
}

function download() {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error('No canvas found on the page');
        return;
    }

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    const now = new Date();
    const formattedDate = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + '.' +
        String(now.getMinutes()).padStart(2, '0') + '.' +
        String(now.getSeconds()).padStart(2, '0');

    link.download = `${formattedDate} ${sketchPath.replaceAll('/', '-')}.png`;
    link.href = dataURL;
    link.click();

}

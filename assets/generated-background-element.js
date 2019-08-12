import { ezOffscreenCanvas } from 'https://unpkg.com/ez-offscreen-canvas';

class GeneratedBackground extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: 'closed' });
        this.canvas = document.createElement('canvas');

        this.resizer = () => {
            const boundingRect = this.parentElement.getBoundingClientRect();
            this.canvas.width = boundingRect.width;
            this.canvas.height = boundingRect.height;
        };

        shadow.innerHTML = `
        <style>
        :host {
            position: absolute;
            top: 0;
            left: 0;
        }
        </style>
        `;
        shadow.appendChild(this.canvas);
    }

    connectedCallback() {
        window.addEventListener('resize', this.resizer, { passive: true });
        this.resizer();
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.resizer, { passive: true });
    }

    render() {
        const canvas = this.canvas;
        const context = canvas.getContext('2d');

        let shift = 0;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            const maxAmplitude = height / 2;
            const frequency = 1 / 200;

            context.clearRect(0, 0, width, height);
            context.fillStyle = 'rgba(255, 255, 255, 0.75)';

            for (let x = 0; x < width; x += 10) {
                for (let amplitude = 40; amplitude < maxAmplitude; amplitude += 20) {
                    const y = Math.sin((shift - x) * frequency) * amplitude;
                    context.fillRect(x, (height / 2) + y, 1, 1);
                }
            }

            shift = shift * frequency > Math.PI * 2 ? 0 : shift + 1;

            requestAnimationFrame(draw);
        }

        draw();
    }
}

customElements.define('generated-background', GeneratedBackground);

/**
 * Loader animation component
 */
export default class Loader {
  constructor() {
    this.element = null;
    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'loader-container';
    this.element.innerHTML = `
      <div class="loader">
        <svg class="loader-circular" viewBox="25 25 50 50">
          <circle class="loader-path" cx="50" cy="50" r="20" fill="none" stroke="var(--primary)" stroke-width="3" />
        </svg>
        <div class="loader-pulse"></div>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('loader-styles')) {
      const style = document.createElement('style');
      style.id = 'loader-styles';
      style.textContent = `
        .loader-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
        }

        .loader-container.visible {
          opacity: 1;
          visibility: visible;
        }

        .loader {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .loader-circular {
          animation: loader-rotate 2s linear infinite;
          height: 100%;
          transform-origin: center center;
          width: 100%;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          margin: auto;
        }

        .loader-path {
          stroke-dasharray: 150, 200;
          stroke-dashoffset: -10;
          animation: loader-dash 1.5s ease-in-out infinite;
          stroke-linecap: round;
        }

        .loader-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          animation: loader-pulse 1s ease-in-out infinite;
        }

        @keyframes loader-rotate {
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes loader-dash {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124;
          }
        }

        @keyframes loader-pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  show() {
    if (!document.body.contains(this.element)) {
      document.body.appendChild(this.element);
    }
    requestAnimationFrame(() => {
      this.element.classList.add('visible');
    });
  }

  hide() {
    this.element.classList.remove('visible');
    setTimeout(() => {
      if (document.body.contains(this.element)) {
        document.body.removeChild(this.element);
      }
    }, 200); // Match transition duration
  }

  static show() {
    const loader = new Loader();
    loader.show();
    return loader;
  }
}
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AiCodeHealer {
  constructor(logger = console) {
    this.logger = logger;
  }

  /**
   * Extrae el selector de la cadena de sugerencia generada por el runner.
   */
  extractSelector(suggestion) {
    const match = suggestion.match(/El selector '([^']+)'/);
    return match ? match[1] : null;
  }

  /**
   * Escanea el directorio y aplica inyección de data-testid a los elementos detectados.
   */
  async heal(suggestions, sourceDir) {
    const selectors = suggestions
      .map(s => this.extractSelector(s))
      .filter(Boolean);

    if (selectors.length === 0) return { healedCount: 0 };

    const files = this.getAllFiles(sourceDir, ['.vue', '.jsx', '.tsx', '.html']);
    let healedCount = 0;

    for (const file of files) {
      let content = fs.readFileSync(file, 'utf-8');
      let modified = false;

      for (const selector of selectors) {
        let regex;
        if (selector.startsWith('.')) {
          const className = selector.substring(1);
          // Busca etiquetas con class="..." que contengan la clase específica
          regex = new RegExp(`(<[a-zA-Z0-9-]+[^>]*class=["'][^"']*?\\b${className}\\b[^"']*["'][^>]*?)(\/?>)`, 'g');
        } else if (selector.startsWith('#')) {
          const idName = selector.substring(1);
          // Busca etiquetas con id="..."
          regex = new RegExp(`(<[a-zA-Z0-9-]+[^>]*id=["']${idName}["'][^>]*?)(\/?>)`, 'g');
        } else {
          // Asume que es un tag (ej: button, div)
          regex = new RegExp(`(<${selector}\\b[^>]*?)(\/?>)`, 'g');
        }

        content = content.replace(regex, (match, p1, p2) => {
          // Evitar inyectar doblemente si ya tiene un data-testid
          if (match.includes('data-testid=')) return match; 
          
          const hash = crypto.randomBytes(3).toString('hex');
          modified = true;
          healedCount++;
          // Agregar un espacio antes del data-testid para asegurar validez HTML
          return `${p1} data-testid="auto-qa-${hash}"${p2}`;
        });
      }

      if (modified) {
        fs.writeFileSync(file, content, 'utf-8');
        if (this.logger && this.logger.info) {
           this.logger.info(`[Healer] Archivo parcheado: ${file}`);
        } else if (this.logger && this.logger.log) {
           this.logger.log(`[Healer] Archivo parcheado: ${file}`);
        }
      }
    }

    return { healedCount };
  }

  getAllFiles(dirPath, extFilter, arrayOfFiles = []) {
    const exists = fs.existsSync(dirPath);
    console.log(`existsSync(${dirPath}) = `, exists);
    if (!exists) return arrayOfFiles;

    const files = fs.readdirSync(dirPath);
    console.log(`readdirSync(${dirPath}) = `, files);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      console.log(`statSync(${fullPath}).isDirectory = `, stat.isDirectory());
      if (stat.isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, extFilter, arrayOfFiles);
      } else {
        if (extFilter.some(ext => fullPath.endsWith(ext))) {
          arrayOfFiles.push(fullPath);
        }
      }
    });

    return arrayOfFiles;
  }
}

module.exports = AiCodeHealer;

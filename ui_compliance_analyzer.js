const fs = require('fs');
const path = require('path');

const webSrcDir = path.join(__dirname, '../timetracking/web/src');
let totalFiles = 0;
let passedFiles = 0;
let totalViolations = 0;

const VUE_EXT = '.vue';

const rules = [
  {
    id: 'no-hidden-required',
    description: 'Evitar inputs ocultos requeridos (causa: "invalid form control is not focusable")',
    check: (content) => {
      // Regex aproximado para detectar v-show="false" o display:none con required
      // Simplificado para la demostración
      return /<input[^>]*?(type="hidden"[^>]*?required|required[^>]*?type="hidden")/i.test(content) 
             || /display:\s*none[^>]*?required/i.test(content);
    }
  },
  {
    id: 'clickable-semantics',
    description: 'Los elementos interactivos div/span con @click deben tener role="button" o tabindex',
    check: (content) => {
      const matches = content.match(/<(div|span)\b[^>]*?@click(\.[\w]+)*=[^>]*?>/gi);
      if (!matches) return false;
      return matches.some(tag => {
        if (/class="[^"]*(overlay|backdrop)[^"]*"/i.test(tag)) return false;
        return !/role=["'](button|tab|link|menuitem)["']/i.test(tag);
      });
    }
  },
  {
    id: 'z-index-drawers',
    description: 'Los overlays de modales/drawers no deben bloquear el body (deben tener handler de cierre al hacer clic)',
    check: (content) => {
      const overlays = content.match(/<[^>]*class="[^"]*drawer-overlay[^"]*"[^>]*>/gi);
      if (!overlays) return false;
      return overlays.some(tag => !/@click(\.self)?=/i.test(tag));
    }
  },
  {
    id: 'empty-button-text',
    description: 'Los botones deben tener texto o aria-label/title para que el AI Runner pueda encontrarlos',
    check: (content) => {
      const emptyButtons = content.match(/<button\b[^>]*>\s*<\/button>/gi);
      if (!emptyButtons) return false;
      return emptyButtons.some(tag => !/(?::?aria-label|title)=/i.test(tag));
    }
  }
];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith(VUE_EXT)) {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath) {
  totalFiles++;
  const content = fs.readFileSync(filePath, 'utf-8');
  let filePassed = true;
  const fileViolations = [];

  for (const rule of rules) {
    if (rule.check(content)) {
      filePassed = false;
      fileViolations.push(rule.id);
      totalViolations++;
    }
  }

  if (filePassed) {
    passedFiles++;
  } else {
    console.log(`❌ Violación en: ${filePath.replace(webSrcDir, '')}`);
    fileViolations.forEach(v => console.log(`   - [${v}]`));
  }
}

console.log('🔍 Iniciando escáner de compatibilidad UI para AI Runner...');
scanDirectory(webSrcDir);

const effectiveness = ((passedFiles / totalFiles) * 100).toFixed(2);
console.log('\n===========================================');
console.log('📊 REPORTE DE EFECTIVIDAD DE UI AUTOMATION');
console.log('===========================================');
console.log(`Archivos Analizados: ${totalFiles}`);
console.log(`Archivos "AI-Ready": ${passedFiles}`);
console.log(`Archivos con posibles bloqueos: ${totalFiles - passedFiles}`);
console.log(`Total de violaciones de reglas: ${totalViolations}`);
console.log(`Porcentaje de Efectividad: ${effectiveness}%`);
console.log('===========================================');

if (effectiveness < 95) {
  console.log('⚠️ Se requiere refactorizar componentes para alcanzar > 95% de efectividad.');
} else {
  console.log('✅ El código base es altamente compatible con pruebas autónomas.');
}


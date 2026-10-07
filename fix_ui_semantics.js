const fs = require('fs');
const path = require('path');

const webSrcDir = path.join(__dirname, '../timetracking/web/src');
const VUE_EXT = '.vue';

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith(VUE_EXT)) {
      fixFile(fullPath);
    }
  }
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Fix clickable semantics
  // Replace <div ... @click="..." ...> with <div ... role="button" tabindex="0" @click="..." ...>
  // Only if role="button" doesn't exist
  content = content.replace(/<(div|span)([^>]*?@click[^>]*?)>/gi, (match, tag, rest) => {
    if (match.includes('role=') || match.includes('role =')) {
      return match;
    }
    return `<${tag} role="button" tabindex="0"${rest}>`;
  });

  // Fix TagsView empty buttons
  if (filePath.includes('TagsView.vue')) {
    content = content.replace(/<button([^>]*?)>/gi, (match, rest) => {
      if (rest.includes('aria-label') || match.includes('>')) {
        // If it already has aria-label, leave it
        if (rest.includes('aria-label')) return match;
        // If it's the edit/delete icon buttons, give them labels
        if (rest.includes('editTag')) return `<button aria-label="Editar etiqueta"${rest}>`;
        if (rest.includes('deleteTag')) return `<button aria-label="Eliminar etiqueta"${rest}>`;
        if (rest.includes('toggleStatus')) return `<button aria-label="Cambiar estado"${rest}>`;
      }
      return match;
    });
  }

  // TimerView z-index overlay issue
  if (filePath.includes('TimerView.vue')) {
    // If there's an overlay without close
    content = content.replace(/<div class="drawer-overlay">/g, '<div class="drawer-overlay" @click="closeDrawer" role="button" tabindex="0">');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath.replace(webSrcDir, '')}`);
  }
}

scanDirectory(webSrcDir);

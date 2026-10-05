const io = require('socket.io-client');

const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('✅ Cliente conectado al backend.');
  console.log('🚀 Solicitando Unit Test para BaseDatePicker.vue...');
  
  socket.emit('start_unit_test_gen', {
    filePath: '/Users/fercho/dev/timetracking/web/src/components/common/BaseDatePicker.vue',
    apiKey: 'gsk_dummy' // Forzar fallback
  });
});

socket.on('unit_test_result', (result) => {
  console.log('\n================================');
  console.log('📈 HTML RENDERIZADO (SIMULADO EN CONSOLA):');
  console.log(`
    <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 8px;">
      <h3>Reporte: Prueba Unitaria (Static Analysis)</h3>
      <p><strong>✓ Archivo guardado en:</strong> ${result.path}</p>
      <pre><code>\n${result.code}\n</code></pre>
    </div>
  `);
  console.log('================================\n');
  process.exit(0);
});

socket.on('unit_test_error', () => {
  console.error('❌ Error generando Unit Test.');
  process.exit(1);
});

socket.on('log', (data) => {
  console.log(`[${data.type.toUpperCase()}] ${data.message}`);
});

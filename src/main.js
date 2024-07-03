// Configurar o visualizador do Cesium
const viewer = new Cesium.Viewer('cesiumContainer', {
    shouldAnimate: true
});

// Definir a lista de posições para a trajetória
const positions = [];

// Definir as propriedades do objeto espacial
const satellitePosition = new Cesium.Cartesian3(10000000.0, 10000000.0, 10000000.0);

// Adicionar uma entidade representando o objeto espacial
const satelliteEntity = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => satellitePosition, false),
    point: {
        pixelSize: 30,
        color: Cesium.Color.YELLOW
    }
});

// Adicionar uma entidade para a linha da trajetória
const trajectoryEntity = viewer.entities.add({
    polyline: {
        positions: new Cesium.CallbackProperty(() => positions, false),
        width: 2,
        material: Cesium.Color.YELLOW
    }
});

// Configurar o relógio para a animação
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
viewer.clock.multiplier = 60;

// Função para atualizar a posição do objeto ao longo do tempo
function updateSatellitePosition(time) {
    const julianDate = Cesium.JulianDate.fromDate(new Date(time));
    const seconds = Cesium.JulianDate.secondsDifference(julianDate, viewer.clock.startTime);

    // Simular a trajetória (aqui, apenas um exemplo simples de movimento circular)
    const angle = seconds * 0.1;
    satellitePosition.x = 10000000.0 * Math.cos(angle);
    satellitePosition.y = 10000000.0 * Math.sin(angle);
    satellitePosition.z = 10000000.0 * Math.sin(angle * 0.5);

    // Adicionar a posição atual à lista de posições
    positions.push(Cesium.Cartesian3.clone(satellitePosition));

    // Limitar o tamanho da trajetória para os últimos 100 pontos
    if (positions.length > 100) {
        positions.shift();
    }
}

viewer.clock.onTick.addEventListener((clock) => {
    updateSatellitePosition(clock.currentTime);
});

// Fazer requisição para obter o token
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        console.log('Token:', data.token);
    })
    .catch(error => console.error('Erro ao obter o token:', error));
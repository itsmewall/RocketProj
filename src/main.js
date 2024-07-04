// Configurar o visualizador do Cesium
const viewer = new Cesium.Viewer('cesiumContainer', {
    shouldAnimate: true,
    infoBox: false,
    selectionIndicator: false,
    timeline: true,
    animation: true,
    homeButton: false,
    sceneModePicker: true,
    navigationHelpButton: false,
    geocoder: false,
});

// Definir a lista de posições para a trajetória do foguete e do satélite
const rocketPositions = [];
const satellitePositions = [];

// Configurar o foguete e o satélite
const rocketPosition = new Cesium.Cartesian3(0, 0, 0);
const satellitePosition = new Cesium.Cartesian3(0, 0, 0);

// Adicionar entidade para o foguete
const rocketEntity = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => rocketPosition, false),
    model: {
        uri: './public/rocket.png',
        scale: 1.0
    },
    label: {
        text: 'Foguete',
        font: '14pt sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20)
    }
});

// Adicionar entidade para o satélite
const satelliteEntity = viewer.entities.add({
    position: new Cesium.CallbackProperty(() => satellitePosition, false),
    model: {
        uri: './public/satelite.png',
        scale: 0.5
    },
    label: {
        text: 'Satélite',
        font: '14pt sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20)
    }
});

// Adicionar trajetória do foguete
const rocketTrajectoryEntity = viewer.entities.add({
    polyline: {
        positions: new Cesium.CallbackProperty(() => rocketPositions, false),
        width: 2,
        material: Cesium.Color.WHITE
    }
});

// Adicionar trajetória do satélite
const satelliteTrajectoryEntity = viewer.entities.add({
    polyline: {
        positions: new Cesium.CallbackProperty(() => satellitePositions, false),
        width: 2,
        material: Cesium.Color.YELLOW
    }
});

// Configurar o relógio para a animação
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
viewer.clock.multiplier = 10;

// Variáveis de controle do estágio
let stage = 0;
const stageSeparationTime = 30; // Tempo de separação do estágio em segundos
const satelliteDeploymentTime = 60; // Tempo de implantação do satélite em segundos

// Função para atualizar a posição do foguete e do satélite ao longo do tempo
function updatePositions(clock) {
    const time = clock.currentTime;
    const seconds = Cesium.JulianDate.secondsDifference(time, viewer.clock.startTime);

    // Lançamento e estágios do foguete
    if (stage === 0) {
        // Foguete subindo
        rocketPosition.x = 0;
        rocketPosition.y = 0;
        rocketPosition.z = seconds * 500; // Subida linear
        rocketPositions.push(Cesium.Cartesian3.clone(rocketPosition));
        if (seconds > stageSeparationTime) {
            stage = 1; // Separar o estágio
        }
    } else if (stage === 1) {
        // Segundo estágio do foguete
        rocketPosition.z += 300; // Continuação da subida
        rocketPositions.push(Cesium.Cartesian3.clone(rocketPosition));
        if (seconds > satelliteDeploymentTime) {
            stage = 2; // Implantar o satélite
        }
    } else if (stage === 2) {
        // Implantar o satélite
        satellitePosition.x = rocketPosition.x;
        satellitePosition.y = rocketPosition.y;
        satellitePosition.z = rocketPosition.z;
        satellitePositions.push(Cesium.Cartesian3.clone(satellitePosition));
        stage = 3; // Finalizar a implantação do satélite
    } else if (stage === 3) {
        // Satélite em órbita
        const angle = (seconds - satelliteDeploymentTime) * 0.1;
        satellitePosition.x = 10000000.0 * Math.cos(angle);
        satellitePosition.y = 10000000.0 * Math.sin(angle);
        satellitePosition.z = 10000000.0 * Math.sin(angle * 0.5);
        satellitePositions.push(Cesium.Cartesian3.clone(satellitePosition));
    }

    // Atualizar informações no painel
    updateInfoPanel(seconds, rocketPosition, satellitePosition);
}

viewer.clock.onTick.addEventListener((clock) => {
    updatePositions(clock);
});

// Configurar a visão inicial para uma visão ampla do planeta
viewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
});

// Função para seguir o satélite
function followSatellite() {
    viewer.trackedEntity = satelliteEntity;
}

document.getElementById('followSatelliteButton').addEventListener('click', followSatellite);

// Função para atualizar o painel de informações
function updateInfoPanel(seconds, rocketPosition, satellitePosition) {
    const timeElement = document.getElementById('time');
    const rocketPositionElement = document.getElementById('rocketPosition');
    const satellitePositionElement = document.getElementById('satellitePosition');
    
    if (timeElement && rocketPositionElement && satellitePositionElement) {
        timeElement.textContent = seconds.toFixed(2) + ' s';
        rocketPositionElement.textContent = `Foguete - X: ${rocketPosition.x.toFixed(2)}, Y: ${rocketPosition.y.toFixed(2)}, Z: ${rocketPosition.z.toFixed(2)}`;
        satellitePositionElement.textContent = `Satélite - X: ${satellitePosition.x.toFixed(2)}, Y: ${satellitePosition.y.toFixed(2)}, Z: ${satellitePosition.z.toFixed(2)}`;
    }
}

// Função para atualizar o nome do satélite
function updateSatelliteName() {
    const newName = document.getElementById('satelliteName').value;
    satelliteEntity.label.text = newName;
}
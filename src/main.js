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

// Lista de satélites brasileiros em operação
const brazilianSatellites = {
    "2019-093A": "CBERS 4A",
    "2019-093G": "FloripaSat-1",
    "2018-099AE": "ITASAT",
    "2017-023B": "SGDC",
    "2014-079A": "CBERS 4",
    "2014-033Q": "NanoSatC-Br1",
    "1998-060A": "SCD 2",
    "1993-009B": "SCD 1",
    "14079A": "CBERS 4"  // Adicionando também formato curto do COSPAR ID
};

// Função para obter dados TLE do site fornecido
async function fetchTLEData() {
    try {
        const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle');
        const tleData = await response.text();
        return tleData;
    } catch (error) {
        console.error('Erro ao obter dados TLE:', error);
        return null;
    }
}

// Função para processar dados TLE e criar entidades no Cesium
function processTLEData(tleData) {
    if (!tleData) {
        console.error('Nenhum dado TLE foi obtido.');
        return;
    }

    const tleLines = tleData.split('\n');
    for (let i = 0; i < tleLines.length; i += 3) {
        const name = tleLines[i].trim();
        const tleLine1 = tleLines[i + 1]?.trim();
        const tleLine2 = tleLines[i + 2]?.trim();
        
        // Ignorar satélites Starlink
        if (name.includes("STARLINK")) {
            continue;
        }

        if (name && tleLine1 && tleLine2) {
            const cosparId = tleLine1.split(" ")[1].trim();
            console.log(`Processando ${name} com COSPAR ID ${cosparId}`);
            if (brazilianSatellites[cosparId]) {
                console.log(`Satélite brasileiro encontrado: ${brazilianSatellites[cosparId]}`);
                const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
                createSatelliteEntity(brazilianSatellites[cosparId], satrec);
            } else {
                console.log(`COSPAR ID ${cosparId} não encontrado na lista de satélites brasileiros.`);
            }
        } else {
            console.error('Erro ao processar linha TLE:', tleLines[i], tleLines[i + 1], tleLines[i + 2]);
        }
    }
}

// Função para criar entidades de satélite no Cesium
function createSatelliteEntity(name, satrec) {
    const positionProperty = new Cesium.SampledPositionProperty();
    
    const satelliteEntity = viewer.entities.add({
        name: name,
        position: positionProperty,
        point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW
        },
        label: {
            text: name,
            font: '14pt sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20)
        }
    });

    function updatePosition() {
        const now = new Date();
        const positionAndVelocity = satellite.propagate(satrec, now);
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const longitude = positionGd.longitude * 180 / Math.PI;
        const latitude = positionGd.latitude * 180 / Math.PI;
        const height = positionGd.height * 1000;

        const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
        positionProperty.addSample(Cesium.JulianDate.fromDate(now), position);

        setTimeout(updatePosition, 1000);
    }

    updatePosition();
}

// Inicializar a visualização de satélites
async function initializeSatellites() {
    const tleData = await fetchTLEData();
    console.log('Dados TLE obtidos:', tleData ? tleData.slice(0, 500) + '...' : 'Erro ao obter dados TLE');
    processTLEData(tleData);
}

// Configurar a visão inicial para uma visão ampla do planeta
viewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
});

// Iniciar a visualização de satélites
initializeSatellites();
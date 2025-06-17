importScripts('/mqtt.min.js'); // Path to the locally hosted MQTT library

let mqttClient = null; // Define mqttClient as a global variable

self.addEventListener('install', () => {
    console.info('Service Worker installed');
});

self.addEventListener('activate', () => {
    console.info('Service Worker activated');
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CONNECT_MQTT') {
        connectToMQTTBroker(event.data.payload);
    }
});

function connectToMQTTBroker({
    topics = [], // Array of topics to subscribe to
    brokerUrl,
    brokerUser,
    brokerPass,
    reconnect = false, // Whether to reconnect if already connected
}) {
    if (!mqttClient || reconnect) {
        mqttClient = mqtt.connect(brokerUrl, {
            username: brokerUser,
            password: brokerPass,
            protocolVersion: 5, // Use MQTT v5
            reconnectPeriod: 1000, // Reconnect every second if disconnected
            connectTimeout: 30 * 1000, // 30 seconds timeout for connection
        });

        mqttClient.on('connect', () => {
            console.log('Connected to MQTT broker');
            if (topics.length > 0) {
                mqttClient.subscribe(topics, (err) => {
                    if (err) {
                        console.error('Failed to subscribe to topics:', err);
                    } else {
                        console.log(`Subscribed to topics: ${topics.join(', ')}`);
                    }
                });
            } else {
                console.warn('No topics provided for subscription');
            }
        });

        mqttClient.on('message', (topic, message) => {
            self.clients.matchAll().then((clients) => {
                for (const client of clients) {
                    client.postMessage({
                        type: 'MQTT_MESSAGE',
                        topic,
                        message: message.toString(),
                    });
                }
            });
        });

        mqttClient.on('error', (err) => {
            console.error('MQTT connection error:', err);
        });
    } else {
        console.log('MQTT client already connected');
    }
}
// --- 1. SETUP THREE.JS (Visual Partikel) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Membuat Partikel Tata Surya
const particlesGeometry = new THREE.BufferGeometry();
const count = 8000; // Jumlah partikel
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for(let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15; // Sebaran partikel
    colors[i] = Math.random(); // Warna acak agar estetik
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
});

const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleMesh);

camera.position.z = 5;

// --- 2. SETUP MEDIAPIPE (Deteksi Tangan) ---
const videoElement = document.getElementById('input_video');

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Koordinat titik tengah telapak tangan (Landmark 9)
        const x = (landmarks[9].x - 0.5) * -15; 
        const y = (landmarks[9].y - 0.5) * -10;
        
        // Gerakkan partikel mengikuti posisi tangan
        particleMesh.position.x = THREE.MathUtils.lerp(particleMesh.position.x, x, 0.1);
        particleMesh.position.y = THREE.MathUtils.lerp(particleMesh.position.y, y, 0.1);

        // Hitung jarak antara ujung jempol (4) dan ujung telunjuk (8)
        const dx = landmarks[4].x - landmarks[8].x;
        const dy = landmarks[4].y - landmarks[8].y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        // LOGIKA: Mengepal (Jarak dekat) = Membesar, Terbuka (Jarak jauh) = Menjauh/Mengecil
        if (distance < 0.05) { 
            // Tangan Mengepal
            particleMesh.scale.lerp(new THREE.Vector3(2.5, 2.5, 2.5), 0.1);
        } else {
            // Tangan Terbuka
            particleMesh.scale.lerp(new THREE.Vector3(0.6, 0.6, 0.6), 0.1);
        }
    }
});

// Jalankan Kamera
const cameraControl = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});
cameraControl.start();

// --- 3. ANIMASI LOOP ---
function animate() {
    requestAnimationFrame(animate);
    particleMesh.rotation.y += 0.002; // Rotasi pelan seperti orbit
    renderer.render(scene, camera);
}

// Handle ukuran layar jika berubah
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

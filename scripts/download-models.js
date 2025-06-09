const fs = require("fs");
const https = require("https");
const path = require("path");

const models = [
  {
    name: "ssd_mobilenetv1_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json",
  },
  {
    name: "ssd_mobilenetv1_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1",
  },
  {
    name: "face_landmark_68_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json",
  },
  {
    name: "face_landmark_68_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1",
  },
  {
    name: "face_recognition_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json",
  },
  {
    name: "face_recognition_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1",
  },
  {
    name: "face_recognition_model-shard2",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2",
  },
];

const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "..", "public", "models", filename);
    const file = fs.createWriteStream(filePath);

    console.log(`📥 Downloading ${filename}...`);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download ${filename}: ${response.statusCode}`)
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          const stats = fs.statSync(filePath);
          console.log(
            `✅ ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
          );
          resolve();
        });

        file.on("error", (err) => {
          fs.unlink(filePath, () => {}); // Delete the incomplete file
          reject(err);
        });
      })
      .on("error", reject);
  });
};

const downloadAllModels = async () => {
  console.log("🚀 Starting face-api.js model download...\n");

  // Ensure models directory exists
  const modelsDir = path.join(__dirname, "..", "public", "models");
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  try {
    for (const model of models) {
      await downloadFile(model.url, model.name);
    }

    console.log("\n🎉 All models downloaded successfully!");
    console.log("📁 Models saved to: public/models/");

    // Verify file sizes
    console.log("\n📊 File verification:");
    const files = fs.readdirSync(modelsDir);
    let totalSize = 0;

    files.forEach((file) => {
      const filePath = path.join(modelsDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      console.log(`   ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
    });

    console.log(`\n📦 Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  } catch (error) {
    console.error("❌ Download failed:", error.message);
    process.exit(1);
  }
};

downloadAllModels();

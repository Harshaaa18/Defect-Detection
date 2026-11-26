import os
import unittest
import torch
import numpy as np
from src.models.autoencoder import ConvAutoencoder
from src.models.backbone import BackboneFeatureExtractor
from src.models.patchcore import PatchCore
from src.evaluation.metrics import compute_image_auroc, compute_pixel_auroc, compute_pro_score

class TestModelsAndEvaluation(unittest.TestCase):
    def test_autoencoder_forward_and_residual(self):
        model = ConvAutoencoder()
        x = torch.randn(2, 3, 224, 224)
        rec = model(x)
        self.assertEqual(rec.shape, (2, 3, 224, 224))
        
        anomaly_map = model.compute_anomaly_map(x)
        self.assertEqual(anomaly_map.shape, (2, 1, 224, 224))

    def test_backbone_extractor_resnet18(self):
        extractor = BackboneFeatureExtractor(backbone_name="resnet18", layer_names=["layer2", "layer3"])
        x = torch.randn(2, 3, 224, 224)
        fmaps = extractor(x)
        self.assertIn("layer2", fmaps)
        self.assertIn("layer3", fmaps)
        self.assertEqual(fmaps["layer2"].shape[0], 2)
        self.assertEqual(fmaps["layer3"].shape[0], 2)
        extractor.close()

    def test_patchcore_embed_and_predict(self):
        extractor = BackboneFeatureExtractor(backbone_name="resnet18", layer_names=["layer2", "layer3"])
        patchcore = PatchCore(backbone=extractor, coreset_sampling_ratio=0.2, n_neighbors=3)

        # Mock dummy memory bank (dim = layer2(128) + layer3(256) = 384 channels)
        dummy_fmaps = {
            "layer2": torch.randn(2, 128, 28, 28),
            "layer3": torch.randn(2, 256, 14, 14)
        }
        patches, spatial_shape = patchcore.embed_patches(dummy_fmaps)
        self.assertEqual(patches.shape[1], 384)
        self.assertEqual(spatial_shape, (28, 28))

        # Coreset subsampling test
        features = np.random.randn(50, 384).astype(np.float32)
        coreset = patchcore.greedy_k_center(features, sampling_ratio=0.1)
        self.assertEqual(coreset.shape[0], 5)

        # Assign memory bank directly for inference verification
        patchcore.memory_bank = features[:10]
        from sklearn.neighbors import NearestNeighbors
        patchcore.knn = NearestNeighbors(n_neighbors=3, metric="euclidean")
        patchcore.knn.fit(patchcore.memory_bank)

        # Predict with image tensor
        test_img = torch.randn(1, 3, 224, 224)
        res = patchcore.predict(test_img)
        self.assertIn("image_score", res)
        self.assertIn("anomaly_map", res)
        self.assertEqual(res["anomaly_map"].shape, (224, 224))
        self.assertIsInstance(res["image_score"], float)

        extractor.close()

    def test_metrics_computation(self):
        labels = [0, 0, 1, 1]
        scores = [0.1, 0.2, 0.8, 0.9]
        auroc = compute_image_auroc(labels, scores)
        self.assertAlmostEqual(auroc, 1.0, places=4)

        masks = [np.zeros((10, 10)), np.ones((10, 10))]
        heatmaps = [np.zeros((10, 10)), np.ones((10, 10))]
        pix_auroc = compute_pixel_auroc(masks, heatmaps)
        self.assertAlmostEqual(pix_auroc, 1.0, places=4)

        pro = compute_pro_score(masks, heatmaps, num_thresholds=10)
        self.assertIsInstance(pro, float)

if __name__ == "__main__":
    unittest.main()

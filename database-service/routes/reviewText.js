const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/auth");
const axios = require("axios");
const env = require("dotenv");
env.config();
const HARMEX_KEY = process.env.HARMEX_KEY;

router.post("/review-text", async (req, res) => {
  try {
    const { productName, key } = req.body;

    if (!productName) {
      return res.status(400).json({
        error: "Bad Request",
        message: "productName is required",
      });
    }

 
    if (!key || key !== HARMEX_KEY) {
      return res.status(400).json({
        error: "Bad Request",
        message: "key is required and must be equal to HARMEX_KEY",
      });
    }

    const providers = [
      {
        name: "deepseek",
        model: "deepseek-chat",
        url: process.env.DEEPSEEK_SERVICE_URL,
      },
      {
        name: "gemini",
        model: "gemini-2.5-pro",
        url: process.env.GEMINI_SERVICE_URL,
      },
      {
        name: "openai",
        model: "gpt-4.1",
        url: process.env.OPENAI_SERVICE_URL,
      },
    ];

    const systemPrompt = `Задача: создать короткий реалистичный положительный отзыв для маркетплейса.
    Товар: ${productName}
    Требования:
    - Объем: 1-2 предложения.
    - Тон: неформальный, довольный.
    - Содержание: упомяни одно конкретное преимущество (вкус, удобство, результат).
    - Избегай шаблонных фраз вроде "рекомендую всем".`;

    const requests = providers.map((provider) => {
      if (!provider.url) {
        console.error(`URL for ${provider.name} is not configured.`);
        return Promise.reject({
          provider: provider.name,
          reason: `URL for ${provider.name} is not configured.`,
        });
      }

      return axios
        .post(
          `${provider.url}/api/ai/${provider.name}`,
          {
            message: systemPrompt,
            systemPrompt: systemPrompt,
            provider: provider.name,
            model: provider.model,
            context: [],
            userId: "68e61fc8e93a63122d0547aa",
          },
          {
            timeout: 30000,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => ({
          ...response.data,
          provider: provider.name,
        }));
    });

    const results = await Promise.allSettled(requests);

    const successfulResponses = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successfulResponses.push(result.value);
      } else {
        const providerName = providers[index].name;
        console.error(`Error with provider ${providerName}:`, result.reason);
      }
    });

    res.json({
      success: true,
      reviews: successfulResponses,
    });
  } catch (error) {
    console.error("Error in /review-text route:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred while reviewing the text.",
    });
  }
});

module.exports = router;

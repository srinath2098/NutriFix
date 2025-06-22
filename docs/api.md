# NutriFix API Documentation

## Blood Test Endpoints

### POST /api/bloodtest/manual
Submit manual blood test entry data.

**Authentication Required**: Yes (OpenID Connect)

**Request Body**:
```json
{
  "testDate": "2024-03-19T10:00:00Z",
  "nutrients": [
    {
      "name": "Vitamin D",
      "value": 25,
      "unit": "ng/mL"
    },
    {
      "name": "Iron",
      "value": 80,
      "unit": "µg/dL"
    }
  ]
}
```

**Validation Rules**:
- testDate: Valid ISO date string, not in future
- nutrients: Array of at least one nutrient
- Each nutrient must have:
  - name: Known nutrient name
  - value: Positive number within plausible range
  - unit: Correct unit for that nutrient

**Response**:
```json
{
  "testId": 123,
  "results": [
    {
      "nutrientName": "Vitamin D",
      "value": 25,
      "unit": "ng/mL",
      "status": "insufficient",
      "severity": "mild",
      "minRange": 30,
      "maxRange": 100
    }
  ],
  "recommendations": [
    {
      "title": "Sunshine Smoothie",
      "description": "Vitamin D and Iron rich smoothie",
      "instructions": "...",
      "ingredients": [
        {
          "name": "spinach",
          "amount": "2",
          "unit": "cups"
        }
      ],
      "cookTime": 5,
      "servings": 2,
      "nutritionalBenefits": [
        "High in Vitamin D",
        "Good source of Iron"
      ],
      "targetNutrients": [
        "vitamin d",
        "iron"
      ],
      "dietaryTags": [
        "vegetarian",
        "gluten-free"
      ]
    }
  ]
}
```

## Error Responses

### 400 Bad Request
Invalid input data.
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "invalid_type",
      "path": ["nutrients", 0, "value"],
      "message": "Value must be positive"
    }
  ]
}
```

### 401 Unauthorized
Missing or invalid authentication.
```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error
Server-side error.
```json
{
  "error": "Failed to process blood test",
  "message": "Error details..."
}
```

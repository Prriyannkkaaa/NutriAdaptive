# Personalized Meal Recommendation System with Feedback-Based Learning

An end-to-end Machine Learning web application that generates personalized daily meal plans based on individual dietary constraints, health targets, pantry ingredients, and an adaptive feedback loop. Built with Python (FastAPI), scikit-learn, SQLite (SQLAlchemy), and React.js (TypeScript, Tailwind CSS, Recharts).

---

## 1. Project Overview & Workflow

The system solves the problem of daily nutritional planning under real-world constraints (allergies, dietary classifications, caloric targets, and budgets in Indian Rupees). It learns continuously from explicit user ratings (Like / Dislike) to personalize subsequent meal recommendations.

```
+-----------------------------------------------------------------------------------------+
|                                    React + Vite UI                                      |
|  - Preference Form (Age, Veg/Vegan, Allergies, Pantry Tags, INR Budget, Calorie Target) |
|  - Meal Plan Dashboard (Daily schedule, Recharts Macro Donut & Budget Gauges)           |
|  - Interactive Meal Cards (Like / Dislike, "Why this meal?", Recipe Details)            |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v  REST API (JSON)
+-----------------------------------------------------------------------------------------+
|                                  FastAPI REST Backend                                   |
|  - Endpoints: /api/preferences, /api/recommendations, /api/feedback, /api/recipes       |
|  - SQLite Database (SQLAlchemy ORM): Recipes, Preferences, Feedback Ledger, History     |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                         ML Recommendation & Learning Engine                             |
|  1. Strict Constraint Filtering (Allergens & Dietary Exclusions)                       |
|  2. Multi-Attribute Feature Scoring:                                                    |
|     - Ingredient Compatibility (TF-IDF Cosine Similarity + Jaccard Token Overlap)       |
|     - Caloric Alignment (Gaussian Proximity Kernel)                                     |
|     - Budget Suitability (Asymmetric INR Penalty Function)                              |
|     - Cuisine Preference Vector Match                                                   |
|  3. Rocchio Adaptive Profile Learning:                                                   |
|     - Dynamic Cuisine & Ingredient Affinity Vectors                                     |
|     - Explicit Recipe Boost (+1.0) & Severe Dislike Suppression (-2.5)                  |
|  4. Constrained Daily Plan Assembly & Inter-Meal Diversity Penalization                 |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

- **Frontend**:
  - React 19 with Vite & TypeScript
  - Tailwind CSS v4 for warm, food-inspired aesthetics
  - Recharts for macronutrient donut breakdown, calorie gauges, and cost bar charts
  - Lucide React for consistent icons
  - Vitest + React Testing Library for frontend component testing
- **Backend**:
  - Python 3.14 & FastAPI with Uvicorn
  - Pydantic v2 for request validation and schema enforcement
  - scikit-learn for TF-IDF feature extraction and cosine similarity
  - NumPy & Pandas for numerical processing
  - SQLite with SQLAlchemy ORM for persistent local storage
  - pytest + httpx for automated backend and recommendation engine testing

---

## 3. Mathematical Recommendation Algorithm

### A. Stage 1: Strict Constraint Filtering
Let $R$ be the candidate recipe catalog and $U$ be the user profile. A recipe $r \in R$ is admitted to category slot $k$ if and only if:
$$\text{Eligible}(r, k) = \mathbb{I}(\text{slot}(r) = k) \times \mathbb{I}(\text{diet}(r) \subseteq \text{diet}(U)) \times \prod_{a \in \text{Allergies}(U)} \mathbb{I}(a \notin \text{Allergens}(r) \land a \notin \text{Tokens}(r))$$

### B. Stage 2: Feature Scoring

1. **Ingredient Compatibility ($S_{\text{ing}}$)**:
   Given user pantry tokens $P$ and recipe tokens $T_r$:
   $$S_{\text{ing}}(r) = 0.6 \cdot \cos(\vec{v}_{\text{tfidf}}(r), \vec{v}_{\text{tfidf}}(P)) + 0.4 \cdot \frac{|T_r \cap P|}{|T_r|}$$

2. **Cuisine Alignment ($S_{\text{cui}}$)**:
   $$S_{\text{cui}}(r) = \min\left(1.0, \max\left(0.0, \mathbb{I}(c_r \in C_{\text{pref}}) + 0.3 \cdot w_{\text{cuisine}}(c_r)\right)\right)$$
   where $w_{\text{cuisine}}$ is the user's learned cuisine affinity from historical feedback.

3. **Caloric Target Proximity ($S_{\text{cal}}$)**:
   Target calories $C_k$ for slot $k$ are allocated proportionally ($25\%$ breakfast, $40\%$ lunch, $10\%$ snacks, $25\%$ dinner). Using a Gaussian proximity kernel with $\sigma_k = 0.3 \cdot C_k$:
   $$S_{\text{cal}}(r, k) = \exp\left(-\frac{(\text{cal}(r) - C_k)^2}{2 \sigma_k^2}\right)$$

4. **Budget Suitability ($S_{\text{bud}}$)**:
   Given slot target budget $B_k$:
   $$S_{\text{bud}}(r, k) = \begin{cases}
   1.0 - 0.3 \cdot \frac{B_k - \text{cost}(r)}{B_k} & \text{if } \text{cost}(r) \le B_k \\
   \max\left(0.0, 1.0 - \frac{\text{cost}(r) - B_k}{1.5 \cdot B_k}\right) & \text{if } \text{cost}(r) > B_k
   \end{cases}$$

5. **Protein Density ($S_{\text{macro}}$)**:
   $$S_{\text{macro}}(r) = \min\left(1.0, \frac{\text{protein}(r)}{\text{cal}(r) / 30}\right)$$

### C. Stage 3: Adaptive Feedback Learning (Rocchio Algorithm)
User feedback is persisted in SQLite across app restarts. For liked set $L$ and disliked set $D$:
$$\vec{V}_{\text{liked}} = \frac{1}{|L|} \sum_{l \in L} \vec{v}(l), \quad \vec{V}_{\text{disliked}} = \frac{1}{|D|} \sum_{d \in D} \vec{v}(d)$$
$$S_{\text{fb}}(r) = \text{DirectFeedback}(r) + \sum_{t \in T_r} w_{\text{token}}(t) + 0.6 \cdot \cos(\vec{v}(r), \vec{V}_{\text{liked}}) - 0.5 \cdot \cos(\vec{v}(r), \vec{V}_{\text{disliked}})$$
- Liked recipes: Receive direct boost $+0.4$ and strengthen related cuisine/ingredient weights.
- Disliked recipes: Receive severe penalty $-2.5$ and overall score multiplier $0.10$, suppressing repeat recommendation.

### D. Stage 4: Composite Weighted Score & Meal Plan Optimization
$$S_{\text{total}}(r) = 0.25 S_{\text{ing}} + 0.20 S_{\text{cui}} + 0.20 S_{\text{cal}} + 0.15 S_{\text{bud}} + 0.05 S_{\text{macro}} + 0.15 S_{\text{fb}}$$
To avoid repeating ingredients across the day, candidates incur an inter-meal token diversity penalty:
$$S_{\text{adj}}(r) = S_{\text{total}}(r) - 0.05 \cdot |T_r \cap \text{Tokens}_{\text{chosen}}|$$

---

## 4. Dataset Overview

The dataset contains **200 realistic, distinct recipes** prioritizing authentic Indian meals:
- **Meal Categories**: 50 Breakfast, 60 Lunch, 40 Snacks, 50 Dinner
- **Cuisines**: North Indian (53), Indian (49), South Indian (28), Continental (34), Chinese (20), Italian (16)
- **Dietary Classifications**: 81 Vegetarian, 68 Vegan, 19 Eggetarian, 32 Non-Vegetarian
- **Nutrition & Pricing**: Realistic caloric values (140 - 680 kcal) and INR costs (₹30 - ₹220) with precise macros ($4P + 4C + 9F \approx \text{kcal}$).

---

## 5. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, database connection, and recipe count |
| `POST` | `/api/preferences` | Save or update user preferences and dietary targets |
| `GET` | `/api/preferences` | Retrieve stored preferences for a user ID |
| `POST` | `/api/recommendations` | Generate personalized meal plan with nutrition & explanations |
| `GET` | `/api/recommendations/history` | Retrieve history of previously generated meal plans |
| `GET` | `/api/recipes` | Search & filter the 200-recipe catalog |
| `GET` | `/api/recipes/{id}` | Retrieve individual recipe instructions and macros |
| `POST` | `/api/feedback` | Submit Like or Dislike rating for a recipe |
| `GET` | `/api/feedback/history` | Retrieve historical ratings and learned affinity summary |
| `DELETE` | `/api/feedback/reset` | Reset user feedback ledger to baseline |

---

## 6. Installation & Execution Guide

### Prerequisites
- Python 3.10+ (Tested on 3.14)
- Node.js 18+ and npm

### Backend Setup
```bash
# 1. From workspace root, create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install fastapi uvicorn pydantic sqlalchemy pytest pandas numpy scikit-learn httpx

# 3. Initialize SQLite database and seed 200 recipes
python3 backend/app/data/seed.py

# 4. Start the FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API documentation is interactively available at: **http://127.0.0.1:8000/docs**

### Frontend Setup
```bash
# 1. Navigate to frontend directory and install dependencies
cd frontend
npm install

# 2. Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser at: **http://127.0.0.1:5173**

---

## 7. Running Automated Tests

### Backend & Recommendation Engine Tests (pytest)
```bash
PYTHONPATH=. ./venv/bin/pytest backend/tests/ -v
```
Verifies:
- Hard constraint filtering (vegan, vegetarian, allergy exclusions for dairy & peanuts)
- Ingredient compatibility similarity scoring
- Calorie and INR budget calculations and warnings
- Feedback persistence across backend restarts
- Positive feedback rank boosting and negative feedback recipe suppression
- FastAPI REST endpoint integration

### Frontend Component & Interaction Tests (vitest)
```bash
cd frontend
npm test
```
Verifies:
- Meal card rendering (nutrition, costs, slot badges)
- Like and dislike click event handlers
- Modal triggers ("Why this meal?", "View Recipe")
- Preferences form inputs, allergen toggles, and submission

---

## 8. Live Demonstration Guide for Evaluators

1. **Preset Quickstart**:
   - Open **http://127.0.0.1:5173**.
   - On the Overview page, click the **"College Student on a Budget (₹160/day)"** preset card.
   - Observe automatic routing to the **Meal Plan Dashboard** showing Breakfast, Lunch, and Dinner.

2. **Algorithmic Transparency**:
   - On any meal card, click **"Why this meal?"**.
   - Review the multi-criteria score breakdown showing ingredient pantry match %, cuisine alignment, Gaussian calorie proximity, and budget allocation fit.

3. **Verifying Feedback-Based Learning**:
   - Click **Like** on a North Indian paneer meal (e.g. *Paneer Stuffed Aloo Paratha*).
   - Notice the green notification banner indicating the rating was stored in SQLite.
   - Click **Dislike** on another meal (e.g. *Bhindi Masala*).
   - Click the **"Regenerate Meal Plan"** button.
   - **Observe the change**: The disliked recipe is immediately eliminated, and recipes sharing features with your liked meal (North Indian cuisine, paneer) are boosted to the top!

4. **Inspect Machine Learning Memory**:
   - Click **"Learning History"** in the top navigation.
   - Review your total likes, dislikes, active learned cuisine affinity vectors, and preferred ingredient tokens.
   - Click **"Reset Learning"** to reset the profile back to zero for subsequent test runs.

5. **Browse 200 Recipes**:
   - Click **"200 Recipes"** to explore the complete catalog with live search (e.g., search "biryani", filter by "South Indian" or "vegan").

---

## 9. Limitations & Future Scope

1. **Cold Start**: New users without feedback rely on stated preference priors and pantry ingredients until feedback is provided.
2. **Collaborative Filtering Extension**: As the user base grows, collaborative filtering (e.g. Matrix Factorization or Neural Collaborative Filtering) can supplement content-based filtering.
3. **Computer Vision Integration**: Future mobile versions can leverage camera snapshots of refrigerators to automatically detect pantry ingredients using object detection (YOLOv8).

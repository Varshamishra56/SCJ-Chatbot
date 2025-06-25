import pandas as pd
import string
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk

nltk.download("punkt")
nltk.download("stopwords")

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

stop_words = set(stopwords.words("english"))

# Load and preprocess FAQ data
faq_df = pd.read_csv("./FAQs.csv")

def preprocess_text(text):
    tokens = word_tokenize(text.lower())
    tokens = [word for word in tokens if word not in stop_words and word not in string.punctuation]
    return " ".join(tokens)

faq_df["processed_question"] = faq_df["Question"].apply(preprocess_text)

# TF-IDF setup
try:
    tfidf_vectorizer = joblib.load("tfidf_vectorizer.pkl")
    tfidf_matrix = joblib.load("tfidf_matrix.pkl")
except FileNotFoundError:
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(faq_df["processed_question"])
    joblib.dump(tfidf_vectorizer, "tfidf_vectorizer.pkl")
    joblib.dump(tfidf_matrix, "tfidf_matrix.pkl")

def retrieve_faq(query, threshold=0.4):
    processed_query = preprocess_text(query)
    query_vector = tfidf_vectorizer.transform([processed_query])
    similarities = cosine_similarity(query_vector, tfidf_matrix)[0]

    # Filter relevant ones
    results = [(i, score) for i, score in enumerate(similarities) if score >= threshold]
    results.sort(key=lambda x: x[1], reverse=True)

    top_faqs = [faq_df.iloc[i].to_dict() for i, _ in results[:3]]  # max 3, only if they pass threshold
    return top_faqs

@app.route("/ask", methods=["POST"])
def ask_bot():
    data = request.get_json(force=True)
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"error": "Empty query"}), 400
    try:
        results = retrieve_faq(query)
        if not results:
            return jsonify([{"Answer": "Sorry, no relevant answer found."}])
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/data", methods=["POST"])
def get_data():
    data = request.get_json()
    page = data.get("pageNumber", 1)
    per_page = data.get("perPage", 10)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = faq_df.iloc[start:end].to_dict(orient="records")
    return jsonify({
        "items": paginated,
        "page": page,
        "perPage": per_page,
        "totalRecords": len(faq_df)
    }), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)

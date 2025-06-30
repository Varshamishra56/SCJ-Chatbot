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
import os

# NLTK Downloads
nltk.download("punkt")
nltk.download("stopwords")

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Load and preprocess FAQ data
faq_path = "FAQs.csv"  
faq_df = pd.read_csv(faq_path)

# Define stopwords
stop_words = set(stopwords.words("english"))

# Preprocess function
def preprocess_text(text):
    tokens = word_tokenize(text.lower())
    tokens = [word for word in tokens if word not in stop_words and word not in string.punctuation]
    return " ".join(tokens)

# Preprocess all questions
faq_df["processed_question"] = faq_df["Question"].apply(preprocess_text)

# TF-IDF setup with persistence
vectorizer_path = "tfidf_vectorizer.pkl"
matrix_path = "tfidf_matrix.pkl"

if os.path.exists(vectorizer_path) and os.path.exists(matrix_path):
    tfidf_vectorizer = joblib.load(vectorizer_path)
    tfidf_matrix = joblib.load(matrix_path)
else:
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(faq_df["processed_question"])
    joblib.dump(tfidf_vectorizer, vectorizer_path)
    joblib.dump(tfidf_matrix, matrix_path)

# FAQ retrieval function
def retrieve_faq(query, top_n=5, threshold=0.3):
    processed_query = preprocess_text(query)
    query_vector = tfidf_vectorizer.transform([processed_query])
    similarities = cosine_similarity(query_vector, tfidf_matrix)[0]

    results = [(i, score) for i, score in enumerate(similarities) if score >= threshold]
    results.sort(key=lambda x: x[1], reverse=True)
    top_faqs = [faq_df.iloc[i].to_dict() for i, _ in results[:top_n]]

    return top_faqs

# API Endpoint to ask FAQ
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

# API Endpoint for paginated FAQ data
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

# Optional: Local testing via command-line
def command_line_mode():
    while True:
        print("Bot: Ask a question about SCJ")
        query = input("You: ").strip()
        if not query:
            print("Bot: Empty query. Try again.")
            continue
        results = retrieve_faq(query)
        if results:
            print(f"\nBot: The Most SIMILAR Question & Answer is:\n{results[0]}")
            print(f"\nBot: Other SIMILAR Questions & Answers are:\n{results[1:]}\n")
        else:
            print("Bot: Sorry, no relevant answer found.\n")

# Entry point
if __name__ == "__main__":
    debug_mode = True
    if debug_mode:
        app.run(debug=True, port=5000)
    else:
        command_line_mode()

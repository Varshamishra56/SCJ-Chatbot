
import os
import csv
import string
from gensim import corpora, models, similarities

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def preprocess_text(text):
    tokens = text.lower().split()
    tokens = [word.strip(string.punctuation) for word in tokens]
    return tokens

faq_data = []
with open("FAQS.csv", "r", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    for row in reader:
        row["processed_question"] = preprocess_text(row["Question"])
        faq_data.append(row)

dictionary = corpora.Dictionary([row["processed_question"] for row in faq_data])
corpus = [dictionary.doc2bow(row["processed_question"]) for row in faq_data]

tfidf = models.TfidfModel(corpus)
index = similarities.MatrixSimilarity(tfidf[corpus])

def retrieve_faq(query):
    query_tokens = preprocess_text(query)
    query_bow = dictionary.doc2bow(query_tokens)
    query_tfidf = tfidf[query_bow]
    sims = index[query_tfidf]
    sims = sorted(enumerate(sims), key=lambda item: -item[1])
    top_5_similar_indices = [i[0] for i in sims[:5]]
    top_5_similar_faqs = [faq_data[i] for i in top_5_similar_indices]
    return top_5_similar_faqs

@app.route('/ask', methods=['POST'])
def ask_bot():
    data = request.get_json()
    query = data["query"]
    top_5_similar_faqs = retrieve_faq(query)
    return jsonify(top_5_similar_faqs), 200

@app.route('/data', methods=['POST'])
def get_data():
    data = request.get_json()
    page = data["pageNumber"]
    per_page = data["perPage"]
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    paginated_data = faq_data[start_index:end_index]
    response = {"items": paginated_data,
                "page": page,
                "perPage": per_page,
                "totalRecords": len(faq_data)}
    return jsonify(response), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
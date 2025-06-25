import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.tokenize import word_tokenize
import string
import joblib
    
"""
For a real-time retrieval system, considering speed and accuracy,a Vector Space Model and Cosine Similarity.
Using numerical vectors is efficienct and Cosine Similarity allows for semantic understanding. 
We use TF-IDF to change text to numerical vectors and cosine similarity to calculate distance in the vector space representation, 
 Using this approach, one can quickly retrieve relevant FAQs based on user queries while still considering semantic similarity.

"""  

try:
    from nltk.corpus import stopwords
except FileNotFoundError:
    import nltk
    nltk.download("stopwords")

def preprocess_text(text):
    tokens = word_tokenize(text.lower())  # Convert to lowercase and tokenize
    tokens = [word for word in tokens if (len(tokens) > 4 and word not in stop_words and word not in string.punctuation) or (len(tokens) <= 4 and word not in string.punctuation)]  # Remove stopwords and punctuation based on condition
    return ' '.join(tokens)

# Load FAQs from CSV
faq_df = pd.read_csv("FAQS.csv")
# Preprocess FAQs
stop_words = set(stopwords.words('english'))
faq_df['processed_question'] = faq_df["Question"].apply(preprocess_text)

# Train TF-IDF vectorizer if not already trained
try:
    tfidf_vectorizer = joblib.load('tfidf_vectorizer.pkl')
    tfidf_matrix= joblib.load('tfidf_matrix.pkl')
except FileNotFoundError:
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(faq_df['processed_question'])
    joblib.dump(tfidf_vectorizer, 'tfidf_vectorizer.pkl')
    joblib.dump(tfidf_matrix, 'tfidf_matrix.pkl')

# Function to retrieve most relevant FAQ
def retrieve_faq(query):
    processed_query = preprocess_text(query)
    query_vector = tfidf_vectorizer.transform([processed_query])
    # Calculate cosine similarity between query and FAQs
    similarities = cosine_similarity(query_vector, tfidf_matrix)
    # Get index of most similar FAQs (top 5)
    most_similar_indices = similarities.argsort()[0][-5:][::-1]
    # get the 5  most relevant FAQs
    top_5_similar_faqs = faq_df.iloc[most_similar_indices, ]
    return top_5_similar_faqs.to_dict(orient='records')
    


while True:
    print("Bot: Ask a question about SCJ")
    query = input("You: ")
    top_5_similar_faqs = retrieve_faq(query)
    
    print(f"Bot: The Most SIMILAR Question & Answer is: \n {top_5_similar_faqs[0]}\n")

    print(f"Bot: Other SIMILAR Questions & Answers are: \n {top_5_similar_faqs[1:]}\n")


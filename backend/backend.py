import json
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymysql
from pymongo import MongoClient
from bson.json_util import dumps, loads
import re

app = Flask(__name__)
CORS(app)

# ✅ MySQL connection
mysql_conn = pymysql.connect(
    host='localhost',
    user='root',
    password='MySQL@1234',
    database='demo',
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=True
)

# ✅ MongoDB Atlas connection
mongo_uri = "mongodb+srv://anishnehete:dsci551@cluster1.ufmq4xd.mongodb.net/?retryWrites=true&w=majority"
mongo_client = MongoClient(mongo_uri)
mongo_db = mongo_client['sample_mflix']  # Use your DB name

@app.route('/querySQL', methods=['POST'])
def handle_query_mysql():
    data = request.get_json()
    user_query = data.get('query', '').strip()
    
    try:
        with mysql_conn.cursor() as cursor:
            cursor.execute(user_query)
            results = cursor.fetchall()
            return jsonify(results)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/queryNoSQL', methods=['POST'])
def handle_query():
    try:
        data = request.get_json()
        user_query = data.get('query')
        user_query = mongo_shell_to_json(user_query)

        if not user_query:
            return jsonify({'error': 'Missing query'}), 400

        # Extract collection name
        collection_match = re.search(r'db\.([a-zA-Z0-9_]+)', user_query)
        if not collection_match:
            if "db.getCollectionNames()" in user_query:
                return jsonify(sorted(mongo_db.list_collection_names()))
            return jsonify({'error': 'Could not parse collection name'}), 400

        collection_name = collection_match.group(1)
        collection = mongo_db[collection_name]

        # Remove 'db.collection.' from the query
        raw_command = re.sub(r'^db\.[a-zA-Z0-9_]+\.', '', user_query)

        # Direct command parsing
        
        if 'db.getCollectionNames()' in raw_command:
            collections = mongo_db.list_collection_names()
            return jsonify(collections)
        
        # Extract the find(...) part
        find_match = re.search(r'find\((.*?)\)', raw_command, re.DOTALL)
        if find_match:
            args = find_match.group(1).strip()

            parts = split_args(args) if args else []
            query = loads(parts[0]) if len(parts) >= 1 and parts[0] else {}
            projection = loads(parts[1]) if len(parts) >= 2 and parts[1] else None

            cursor = collection.find(query, projection)

            # Handle .limit(N) chaining
            limit_match = re.search(r'\.limit\((\d+)\)', raw_command)
            if limit_match:
                limit = int(limit_match.group(1))
                cursor = cursor.limit(limit)

            return dumps(list(cursor))

        elif raw_command.startswith("findOne("):
            match = re.search(r'findOne\((.*)\)', raw_command)
            args = match.group(1)
            query = loads(args) if args else {}
            result = collection.find_one(query)
            return dumps(result)

        elif raw_command.startswith("aggregate("):
            match = re.search(r'aggregate\((.*)\)', raw_command, re.DOTALL)
            pipeline = loads(match.group(1))
            result = collection.aggregate(pipeline)
            return dumps(list(result))

        elif raw_command.startswith("insertOne("):
            match = re.search(r'insertOne\((.*)\)', raw_command, re.DOTALL)
            doc = loads(match.group(1))
            result = collection.insert_one(doc)
            return jsonify({'inserted_id': str(result.inserted_id)})

        elif raw_command.startswith("insertMany("):
            match = re.search(r'insertMany\((.*)\)', raw_command, re.DOTALL)
            docs = loads(match.group(1))
            result = collection.insert_many(docs)
            return jsonify({'inserted_ids': [str(i) for i in result.inserted_ids]})

        elif raw_command.startswith("updateOne("):
            args = extract_update_args(raw_command, "updateOne")
            result = collection.update_one(*args)
            return jsonify({'matched_count': result.matched_count, 'modified_count': result.modified_count})

        elif raw_command.startswith("updateMany("):
            args = extract_update_args(raw_command, "updateMany")
            result = collection.update_many(*args)
            return jsonify({'matched_count': result.matched_count, 'modified_count': result.modified_count})

        elif raw_command.startswith("deleteOne("):
            match = re.search(r'deleteOne\((.*)\)', raw_command, re.DOTALL)
            query = loads(match.group(1))
            result = collection.delete_one(query)
            return jsonify({'deleted_count': result.deleted_count})

        else:
            return jsonify({'error': 'Unsupported operation'}), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def split_args(arg_str):
    stack = []
    current = ''
    args = []

    for char in arg_str:
        if char == ',' and not stack:
            args.append(current.strip())
            current = ''
        else:
            if char in ['{', '[', '(']:
                stack.append(char)
            elif char in ['}', ']', ')']:
                if stack:
                    stack.pop()
            current += char

    if current:
        args.append(current.strip())

    return args

def extract_update_args(command_str, method):
    """
    Extracts and loads the arguments for updateOne or updateMany operations.
    Supports 2 or 3 arguments.
    """
    match = re.search(rf'{method}\((.*)\)', command_str, re.DOTALL)
    raw_args = match.group(1)
    parts = split_args(raw_args)
    if len(parts) == 2:
        return loads(parts[0]), loads(parts[1])
    elif len(parts) == 3:
        return loads(parts[0]), loads(parts[1]), loads(parts[2])
    else:
        raise ValueError("Invalid arguments for update operation")

def mongo_shell_to_json(s):
    # Replace keys like age: -> "age":
    s = re.sub(r'([{,]\s*)(\w+)(\s*:\s*)', r'\1"\2"\3', s)
    # Replace $gt, $lt etc.: $gt -> "$gt"
    s = re.sub(r'(\s*)(\$[a-zA-Z]+)(\s*:\s*)', r'\1"\2"\3', s)
    return s

if __name__ == '__main__':
    app.run(debug=True)
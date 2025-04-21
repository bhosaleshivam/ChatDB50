import json
import traceback
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from pymongo import MongoClient
from bson.json_util import dumps

app = Flask(__name__)
CORS(app)

# MySQL connection
mysql_conn = pymysql.connect(
    host='localhost',
    user='root',
    password='MySQL@1234',
    database='employees',
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=True
)

# MongoDB Atlas connection
mongo_uri = "mongodb+srv://anishnehete:dsci551@cluster1.ufmq4xd.mongodb.net/?retryWrites=true&w=majority"
mongo_client = MongoClient(mongo_uri)
mongo_db = mongo_client['sample_mflix']

@app.route('/querySQL', methods=['POST'])
def handle_query_mysql():
    data = request.get_json()
    user_query = data.get('query', '').strip()
    print("user_query: ", user_query)
    
    try:
        with mysql_conn.cursor() as cursor:
            cursor.execute(user_query)
            # If the query is a SELECT statement
            if user_query.lower().startswith(('select', 'show')):
                results = cursor.fetchall()
                return jsonify(results)
            else:
                # For INSERT, UPDATE, DELETE — commit the change
                mysql_conn.commit()
                if cursor.rowcount == 0:
                    return jsonify({"warning": "Query executed, but no rows were affected."})
                return jsonify({"message": f"Query executed successfully. Rows affected: {cursor.rowcount}"})
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/queryNoSQL', methods=['POST'])
def handle_query_nosql():
    data = request.get_json()
    user_query = data.get('query', '').strip()
    user_query = user_query.replace("`","")

    try:
        print(">>> Received query:", user_query)

        # Allow both 'mongo' prefix and direct db command
        raw = user_query[len('mongo'):].strip() if user_query.lower().startswith('mongo') else user_query

        if not raw.startswith('db.'):
            return jsonify({"error": "Query must start with db.collection.command(...)"}), 400
        if raw.lower() == "show collections" or raw.strip().lower() == "db.getcollectionnames()":
            collections = mongo_db.list_collection_names()
            return jsonify({"collections": collections})
        match = re.match(r'db\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\((.*)\)', raw, re.DOTALL)
        if not match:
            return jsonify({"error": "Invalid MongoDB command format."}), 400

        collection_name, command, args_str = match.groups()
        collection = mongo_db[collection_name]

        print(">>> Collection:", collection_name)
        print(">>> Command:", command)
        print(">>> Raw args:", args_str)

        # Clean up input if needed (optional)
        args_str = mongo_shell_to_json(args_str)

        try:
            args = json.loads(f"[{args_str}]")
        except json.JSONDecodeError as e:
            return jsonify({"error": "Failed to parse JSON arguments", "details": str(e)}), 400

        if command == "find":
            cursor = collection.find(*args)
            return app.response_class(response=dumps(cursor), mimetype='application/json')
        elif command == "findOne":
            result = collection.find_one(*args)
            return app.response_class(response=dumps(result), mimetype='application/json')
        
        elif command == "aggregate":
            cursor = collection.aggregate(*args)
            return app.response_class(response=dumps(cursor), mimetype='application/json')
    
        elif command == "insertOne":
            result = collection.insert_one(*args)
            return jsonify({"message": "Inserted", "inserted_id": str(result.inserted_id)})

        elif command == "insertMany":
            result = collection.insert_many(*args)
            return jsonify({"message": "Inserted many", "inserted_ids": [str(_id) for _id in result.inserted_ids]})

        elif command == "updateOne":
            result = collection.update_one(*args)
            return jsonify({
                "message": "Updated",
                "matched_count": result.matched_count,
                "modified_count": result.modified_count
            })
        
        elif command == "updateMany":
            result = collection.update_many(*args)
            return jsonify({
                "message": "Updated many",
                "matched_count": result.matched_count,
                "modified_count": result.modified_count
            })

        elif command == "deleteOne":
            result = collection.delete_one(*args)
            return jsonify({
                "message": "Deleted",
                "deleted_count": result.deleted_count
            })

        else:
            return jsonify({"error": f"Unsupported MongoDB command: {command}"}), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def mongo_shell_to_json(s):
    """
    Clean user input for common Mongo shell-style queries.
    Converts: name: Arya -> "name": "Arya"
    """
    s = re.sub(r'([{,]\s*)(\w+)(\s*:\s*)', r'\1"\2"\3', s)
    s = re.sub(r'(\s*)(\$[a-zA-Z_]+)(\s*:\s*)', r'\1"\2"\3', s)

    def quote_unquoted_values(match):
        key, val = match.group(1), match.group(2).strip()
        if re.match(r'^-?\d+(\.\d+)?$', val) or val in ["true", "false", "null"] or val.startswith(('{', '[', '"')):
            return f"{key}{val}"
        return f'{key}"{val}"'

    s = re.sub(r'(:\s*)([^,\}\]\s]+(?:\s[^,\}\]\s]+)*)', quote_unquoted_values, s)
    return s


if __name__ == '__main__':
    app.run(debug=True)

import json
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymysql
from pymongo import MongoClient
from bson.json_util import dumps
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

@app.route('/query', methods=['POST'])
def handle_query():
    data = request.get_json()
    user_query = data.get('query', '').strip()
    
    try:

        with mysql_conn.cursor() as cursor:
            cursor.execute(user_query)
            results = cursor.fetchall()
            return jsonify(results)

        if user_query.lower().startswith('mysql'):
            sql = user_query[len('mysql'):].strip()
            with mysql_conn.cursor() as cursor:
                cursor.execute(sql)
                if cursor.description:
                    result = cursor.fetchall()
                    return jsonify(result)
                else:
                    return jsonify({
                        "message": "Query executed successfully.",
                        "affected_rows": cursor.rowcount
                    })

        # ✅ Handle MongoDB queries
        elif user_query.lower().startswith('mongo'):
            raw = user_query[len('mongo'):].strip()
            if raw.startswith('db.'):
                match = re.match(r'db\.(\w+)\.(\w+)\((.+)\)', raw)
                if not match:
                    return jsonify({"error": "Invalid MongoDB command format."}), 400

                collection_name, command, args_str = match.groups()
                collection = mongo_db[collection_name]

                # ✅ Use JSON parser for JS-style syntax
                try:
                    args = json.loads(f"[{args_str}]")
                except json.JSONDecodeError as e:
                    return jsonify({"error": f"Failed to parse JSON arguments: {str(e)}"}), 400

                # ✅ Handle supported commands
                if command == "find":
                    cursor = collection.find(*args)
                    return app.response_class(response=dumps(cursor), mimetype='application/json')

                elif command == "aggregate":
                    cursor = collection.aggregate(*args)
                    return app.response_class(response=dumps(cursor), mimetype='application/json')

                elif command == "insertOne":
                    result = collection.insert_one(*args)
                    return jsonify({"message": "Inserted", "id": str(result.inserted_id)})

                elif command == "updateOne":
                    result = collection.update_one(*args)
                    return jsonify({
                        "message": "Updated",
                        "matched": result.matched_count,
                        "modified": result.modified_count
                    })

                elif command == "deleteOne":
                    result = collection.delete_one(*args)
                    return jsonify({
                        "message": "Deleted",
                        "deleted_count": result.deleted_count
                    })

                else:
                    return jsonify({"error": f"Unsupported MongoDB command: {command}"}), 400

            else:
                return jsonify({"error": "Use format: mongo db.collection.command(...)"}), 400

        else:
            return jsonify({"error": "Query must start with 'mysql' or 'mongo'."}), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=3000)

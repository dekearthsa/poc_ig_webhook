const VERIFY_TOKEN = "1234test";

exports.handler = async (event) => {
    if (event.httpMethod === "GET") {
        const params = event.queryStringParameters;
        if (
            params["hub.mode"] === "subscribe" &&
            params["hub.verify_token"] === VERIFY_TOKEN
        ) {
            return {
                statusCode: 200,
                body: params["hub.challenge"],
            };
        } else {
            return {
                statusCode: 403,
                body: "Verification failed",
            };
        }
    }

    if (event.httpMethod === "POST") {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (err) {
            console.error("Invalid JSON:", err);
            return { statusCode: 400, body: "Invalid JSON" };
        }

        console.log("Event:", JSON.stringify(body));

        for (const entry of body.entry || []) {

            const changes = entry.changes || [];
            for (const change of changes) {
                if (change.field === "comments") {
                    console.log("📣 New IG Comment:", change.value);
                } else if (change.field === "messages") {
                    console.log("💬 New IG Message:", change.value);
                }
            }
        }

        return { statusCode: 200, body: "EVENT_RECEIVED" };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};

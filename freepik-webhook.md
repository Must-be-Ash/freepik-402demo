Title: Webhooks - Freepik API

URL Source: https://docs.freepik.com/webhooks

Markdown Content:
### What are webhooks?

Webhooks are a way for one system to send real-time data to another system. They are a powerful tool for integrating different services and automating workflows. With webhooks, you can receive notifications, updates, and data from external systems without having to poll for changes.

### How do webhooks work?

Webhooks work by allowing you to register a URL with a service that supports them. When an event occurs in the service, it sends an HTTP POST request to the registered URL with relevant data. The receiving system can then process the data and take appropriate actions based on the event.

### Why use webhooks?

Webhooks offer several advantages over traditional polling-based methods:

*   **Real-time updates**: Webhooks provide instant notifications, allowing you to react to events as they happen.
*   **Efficiency**: They reduce the overhead of constant requests by delivering data only when an event occurs.
*   **Automation**: Webhooks trigger automatic workflows, reducing manual processes and streamlining tasks.
*   **Seamless integration**: They facilitate easy data exchange between systems, enabling efficient communication between different platforms.

### Common use cases for webhooks

Webhooks are widely used in the following scenarios:

*   **Notifications**: Sending real-time alerts and updates to users or systems.
*   **Data synchronization**: Ensuring that data remains consistent across multiple platforms.
*   **Workflow automation**: Initiating tasks like sending emails, updating databases, or processing transactions based on specific events.

By using webhooks, you can streamline your workflows, improve efficiency, and create seamless integrations between different systems.

Webhook security
----------------

### Why webhook security is important?

Webhooks are a powerful way to connect different systems and services. They allow you to send real-time data from one system to another. However, with great power comes great responsibility. Webhooks can be a security risk if not implemented correctly, as they can be exploited by attackers to send malicious data to your system.

To ensure the integrity and authenticity of incoming webhook requests, we deliver three headers with each request:

*   `webhook-id`: A unique identifier for the webhook request. This helps to detect and prevent replay attacks.
*   `webhook-timestamp`: A timestamp indicating when the webhook request was sent. This is used to ensure that the request is recent and prevents replay attacks within a specific time window.
*   `webhook-signature`: A signature generated using a secret key. This is used to verify the authenticity of the request, ensuring that it was sent by a trusted source.

### Generating the string to sign for verification

You must generate a content string that will be signed and verified. This content is created by concatenating the `webhook-id`, `webhook-timestamp`, and the request body with a period (`.`) separator. You can do this by following these steps:

1.   **Retrieve the headers**: Extract the `webhook-id` and `webhook-timestamp` from the request headers.
2.   **Access the request body**: Obtain the raw body of the webhook request.
3.   **Concatenate the values**: Combine the `webhook-id`, `webhook-timestamp`, and body into a single string using the format mentioned earlier.

Here is an example of how you can generate the content to sign in Python:

### Obtaining the secret key

The secret key is a shared secret between your system and the webhook provider. It is used to generate the signature and verify the authenticity of the request. Make sure to keep the secret key secure and never expose it in your code or configuration files.To obtain the secret key, you can go to the [User Dashboard](https://www.freepik.com/developers/dashboard/api-key) and generate a new secret key. Copy the secret key and store it securely in your system.

### Generating the signature

For the webhook signature, we use HMAC-SHA256 as the hashing algorithm. You can generate the signature by following these steps:

1.   Encode the secret key as bytes.
2.   Obtain the HMAC-SHA256 hash as bytes of the content to sign using the secret key.
3.   Encode the hash in base64 to get the signature.

Here is an example of how you can generate the signature in Python:

The obtained signature must be compared with the `webhook-signature` header in the incoming request to verify the authenticity of the request. If the signatures match, the request is considered valid, and you can process it further.The `webhook-signature` header is composed of a list of space-delimited signatures and their corresponding version identifiers. This allows you to rotate the secret key without breaking existing webhook integrations. For example, the header might look like this:

```
v1,signature1 v2,signature2
```

You should iterate over the list of signatures and verify each one using the corresponding secret key version. If any of the signatures match, the request is considered valid. For example, you can implement this logic in Python as follows:

By following these steps, you can ensure the security of your webhook implementation and protect your system from unauthorized access and data tampering.
# Shortcuts and future work

I would not necessarily consider these shortcuts, but more like future work. Regardless I think these are valid improvements that I would do were it a real application.

## Eval

Create an evaluation dataset with verified good questions and answers that we want to support. This should cover different tool calls, unsupported questions, questions about secific menu items etc. This is useful if we ever want to change the prompt or model and make sure we do not get regressions in the answers.

## Strengthen prompt-injection handling

The current instructions tell the model to treat user text and tool results as data, never as instructions to change its rules. I would add tests with prompt-injection attempts to evaluate how well this works and improve the handling based on the results. Prompt instructions alone do not guarantee protection.

## Conversation support

Right now only one input message is considered. The user cannot ask follow up questions. For a chat bot this is a required feature. But since this case mainly was aimed at getting the two tools working this was not a focus. To do this I would re-use the existing chat and feed that into further request.

## Persistent embedding

The current application regenerates the embeddings on launch. This is not needed as we're using the same vector database. For a proper product I would host the vector database in the cloud, and update it when new documents are added. This is not a problem currently though because we're dealing with a very limited set of data.

## Abuse control

To prevent abuse I would implement rate limits.

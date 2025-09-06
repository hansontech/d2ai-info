import type { APIGatewayProxyHandlerV2, APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        // Parse the incoming HTTP request
        const { body, headers, requestContext } = event;
        const httpMethod = requestContext.http.method; 
        // Only allow POST requests
        if (httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Method not allowed. Use POST.'
                })
            };
        }
        
        // Parse request body
        let requestData;
        try {
            requestData = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (parseError) {
            console.error('Error parsing request body:', parseError);
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Invalid JSON in request body',
                    details: (parseError as Error).message
                })
            };
        }
        
        // Validate required fields for TOTEM inference
        const validationResult = validateData(requestData);
        if (!validationResult.isValid) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Invalid request data',
                    details: validationResult.errors
                })
            };
        }
        
        // Prepare EventBridge event
        const eventDetail = {
            inference_data: {
                x: requestData.x || [],
                y: requestData.y || [],
                codeids_x: requestData.codeids_x,
                codeids_y_labels: requestData.codeids_y_labels
            },
            metadata: {
                batch_id: requestData.batch_id || generateBatchId(),
                timestamp: new Date().toISOString(),
                source: requestData.source || 'api_gateway',
                priority: requestData.priority || 'normal',
                request_id: requestContext?.requestId || 'unknown',
                user_agent: headers?.['User-Agent'] || 'unknown',
                ...requestData.metadata
            }
        };
        
        // Send event to EventBridge
        const putEventsCommand = new PutEventsCommand({
            Entries: [
                {
                    Source: process.env.EVENT_SOURCE_NAME || 'd2ai.totem.inference',
                    DetailType: 'Inference Request',
                    Detail: JSON.stringify(eventDetail),
                    EventBusName: process.env.EVENT_BUS_NAME || 'default'
                }
            ]
        });
        
        const eventBridgeResponse = await eventBridge.send(putEventsCommand);
        
        // Check if event was successfully sent
        const failedEntryCount = eventBridgeResponse.FailedEntryCount || 0;
        if (failedEntryCount > 0) {
            console.error('EventBridge put_events failed:', eventBridgeResponse.Entries);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Failed to send event to EventBridge',
                    details: eventBridgeResponse.Entries
                })
            };
        }
        
        const eventId = eventBridgeResponse?.Entries && eventBridgeResponse.Entries[0]?.EventId
            ? eventBridgeResponse.Entries[0].EventId
            : 'unknown';
        console.log(`Event sent successfully. EventId: ${eventId}`);
        
        // Return success response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({
                success: true,
                message: 'Inference request submitted successfully',
                event_id: eventId,
                batch_id: eventDetail.metadata.batch_id,
                timestamp: eventDetail.metadata.timestamp
            })
        };
        
    } catch (error) {
        console.error('Error in handler:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: (error as Error).message,
                request_id: event.requestContext?.requestId
            })
        };
    }
}

/**
 * Validate inference data structure
 */
function validateData(data: any) {
    const errors: string[] = [];

    // Check required fields
    if (!data.x) {
        errors.push('Missing required field: x');
    }
    
    // Validate data types and shapes
    if (data.x && !Array.isArray(data.x)) {
        errors.push('x must be an array');
    }
    
    // Validate dimensions (basic check)

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Generate a unique batch ID
 */
function generateBatchId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `batch_${timestamp}_${random}`;
}
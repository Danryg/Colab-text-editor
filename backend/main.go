package main

import (
    "log"
    "net/http"
	"fmt"
    "github.com/gorilla/websocket"
)



type file struct {
    id   string
    name string
    path string
}


var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

var clients = make(map[string]*websocket.Conn) // connected clients
var number int = 0


func broadcastMessage(messagetype int, senderID string, message []byte) {
    for clientID, conn := range clients {
        if clientID != senderID {
            err := conn.WriteMessage(websocket.TextMessage, message)
            if err != nil {
                // Handle the error, e.g., log it or manage client disconnection
            }
        }
    }
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	log.Println("handleConnections")
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Fatal(err)
        return
    }
    
	number = number + 1
	uniqueID := fmt.Sprintf("%d", number)
	clients[uniqueID] = conn

    

    // Your application-specific logic for handling WebSocket messages
    go handleClient(conn, uniqueID)
}

func handleClient(conn *websocket.Conn, clientID string) {
	log.Printf("handleClient %s", clientID)
	defer conn.Close()
    for {
		log.Printf("Reading from %s", clientID)
        messageType, p, err := conn.ReadMessage()
        if err != nil {
            // Handle disconnection and remove the client from the data structure
			log.Printf("Error reading from %s", err)
            delete(clients, clientID)
            return
        }
		log.Printf("Broadcasting %s from %s",p, clientID)
        // Process the received message
        // Broadcast the message to all other clients
        broadcastMessage(messageType, clientID, p)
    }
}


func main() {
    http.HandleFunc("/ws", handleConnections)

    go func() {
        log.Fatal(http.ListenAndServe(":8080", nil))
    }()

    log.Println("Server is running on :8080")
    select {}
}

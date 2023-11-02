package main

import (
    "log"
    "net/http"
	"fmt"
    "github.com/gorilla/websocket"
    "strings"
    "strconv"
)





type file struct {
    id   string
    name string
    components []string
    path string
}


var files = []file{
    {
        id: "1",
        name: "file1",
        components: []string{"Header 1", "This is some text", "fmt.Println(\"Hello, world!\")"},
        path: "/path/to/file1",
    },
    {
        id: "2",
        name: "file2",
        components: []string{"Header 2", "More text here", "fmt.Println(\"Another example\")"},
        path: "/path/to/file2",
    },
    {
        id: "3",
        name: "file3",
        components: []string{"Header 3", "Even more text", "fmt.Println(\"Last example\")"},
        path: "/path/to/file3",
    },
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

func broadcastComponentChange(conn *websocket.Conn, fileID string, componentNumber int, component string, senderID string) {
    typeByte := []byte("3")
    message := append(typeByte, []byte("|&$")...)
    message = append(message, []byte(fileID)...)
    message = append(message, []byte("|&$")...)
    message = append(message, []byte(strconv.Itoa(componentNumber))...)
    message = append(message, []byte("|&$")...)
    message = append(message, []byte(component)...)


    for clientID, conn := range clients {
        if clientID != senderID{
            err := conn.WriteMessage(websocket.TextMessage, message)
            if(err != nil) {
                fmt.Println("Error writing to socket: ", err)
            }
        }
    }
        
    

}


func broadcastFiles(conn *websocket.Conn) {
    for _, file := range files {
        typeByte := []byte("1")
        message := append(typeByte, []byte("|&$")...)
        message = append(message, []byte(file.id)...)
        message = append(message, []byte("|&$")...)
        message = append(message, []byte(file.name)...)
        message = append(message, []byte("|&$")...)
        
        for _, component := range file.components {
            message = append(message, []byte(component)...)
            message = append(message, []byte("|&$")...)
        }
       
        
        err := conn.WriteMessage(websocket.TextMessage, message)
        if err != nil {
            // Handle the error, e.g., log it or manage client disconnection
            fmt.Println("Error writing to socket: ", err)
        }
    }

}


func handleClient(conn *websocket.Conn, clientID string) {
	log.Printf("handleClient %s", clientID)
	defer conn.Close()

    broadcastFiles(conn)

    for {
		log.Printf("Reading from %s", clientID)
        messageType, p, err := conn.ReadMessage()
        if err != nil {
            // Handle disconnection and remove the client from the data structure
			log.Printf("Error reading from %s", err)
            delete(clients, clientID)
            return
        }

        fmt.Println(strings.Split(string(p), "|&$"))
        tokens := strings.Split(string(p), "|&$");
        if(tokens[0] == "1") {
            if(len(tokens) >= 3) {
                addFile(file{id: tokens[1], name: tokens[2], components: tokens[3:len(tokens)-1]})
            } else{
                addFile(file{id: tokens[1], name: tokens[2], components: []string{}})
            }
            broadcastFiles(conn)
        } else if(tokens[0] == "2") {
            
        } else if(tokens[0] == "3") {
            fmt.Println("Edit file: ")
            for i, tempFile := range files {
                if(tempFile.id == tokens[1]) {
                    num, err := strconv.Atoi(tokens[2])
                    if(err != nil) {
                        fmt.Println("Error converting string to int: ", err)
                    }
                    tempFile.components[num] = tokens[3]
                    files[i] = tempFile
                }
            }
            num, err := strconv.Atoi(tokens[2])
            if(err != nil) {
                fmt.Println("Error converting string to int: ", err)
            }
            broadcastComponentChange(conn, tokens[1],num , tokens[3], clientID)
        } else if(tokens[0] == "4") {
            fmt.Println("add row: ")
            for i, tempFile := range files {
                if(tempFile.id == tokens[1]) {
                    num, err := strconv.Atoi(tokens[2])
                    if err != nil {
                        fmt.Println("Error converting string to int: ", err)
                    tempFile.components = append(tempFile.components, tokens[2])
                    files[i] = tempFile
                }
            }
            
        
        }
        fmt.Println("Message received: ", messageType)
        // Process the received message
        // Broadcast the message to all other clients
        
    }
}

func addFile(inFile file) {
    files = append(files, inFile)
}



func main() {
    http.HandleFunc("/ws", handleConnections)

    go func() {
        log.Fatal(http.ListenAndServe(":8080", nil))
    }()

    log.Println("Server is running on :8080")
    select {}
}

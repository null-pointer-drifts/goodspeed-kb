import ChatWindow from '../../components/ChatWindow';

export default function ChatPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 53px)' }}>
      <ChatWindow />
    </div>
  );
}

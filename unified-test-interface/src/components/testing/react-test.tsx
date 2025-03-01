// This is a test component to verify React is imported correctly
// If this component can render without errors, React imports are working correctly

// Using JSX Runtime automatic
const ReactTest = () => {
  return (
    <div className="p-4 border rounded bg-blue-100">
      <h2 className="text-lg font-bold">React Test Component</h2>
      <p>If you can see this component, React imports are working correctly!</p>
    </div>
  );
};

export default ReactTest; 
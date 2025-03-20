import React, { useState, useEffect, useCallback, useRef } from 'react';

const App = () => {
  const [maze, setMaze] = useState(null);
  const [width, setWidth] = useState(21);
  const [height, setHeight] = useState(21);
  const [algorithm, setAlgorithm] = useState('bfs');
  const [finalPath, setFinalPath] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [visitedCells, setVisitedCells] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [stats, setStats] = useState({ pathLength: 0, solveTime: 0 });
  const [animationSpeed, setAnimationSpeed] = useState(20);
  const [showAnimation, setShowAnimation] = useState(true);

  // Animation timers
  const animationRef = useRef(null);
  
  // Clear any running animations
  const clearAnimations = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  };

  // Maze Cell Component
  const Cell = ({ type, isPath, isVisited, isCurrentPath }) => {
    let backgroundColor = 'white';
    if (type === '#') backgroundColor = 'black';
    else if (type === 'S') backgroundColor = 'green';
    else if (type === 'E') backgroundColor = 'red';
    else if (isCurrentPath) backgroundColor = 'yellow';
    else if (isPath) backgroundColor = 'blue';
    else if (isVisited) backgroundColor = 'rgba(25, 31, 52, 0.6)'; // grey transparent

    return (
      <div 
        className="flex-shrink-0 border border-gray-200" 
        style={{ 
          backgroundColor, 
          width: '20px', 
          height: '20px',
          transition: 'background-color 0.2s'
        }}
      />
    );
  };

  // Maze generation function
  const generateMaze = useCallback(() => {
    clearAnimations();
    setIsGenerating(true);
    setFinalPath(null);
    setCurrentPath([]);
    setVisitedCells(new Set());

    // Create new maze with walls
    const newMaze = {
      width,
      height,
      grid: Array.from({ length: height }, () => Array(width).fill('#')),
      start: [1, 1],
      end: [height - 2, width - 2]
    };

    // Define the directions: right, down, left, up
    const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
    
    // Start at a random point (must be odd coordinates)
    const getRandomOdd = (min, max) => {
      let r = Math.floor(Math.random() * (max - min + 1)) + min;
      return r % 2 === 0 ? r - 1 : r;
    };
    
    const startRow = getRandomOdd(1, height - 2);
    const startCol = getRandomOdd(1, width - 2);
    newMaze.grid[startRow][startCol] = ' ';
    
    // Stack for DFS maze generation
    const stack = [[startRow, startCol]];
    
    // Generate maze using DFS
    setTimeout(() => {
      while (stack.length > 0) {
        const [currentRow, currentCol] = stack[stack.length - 1];
        
        // Find unvisited neighbors
        const neighbors = [];
        for (const [dr, dc] of directions) {
          const newRow = currentRow + dr;
          const newCol = currentCol + dc;
          if (0 < newRow && newRow < height - 1 && 0 < newCol && newCol < width - 1 && 
              newMaze.grid[newRow][newCol] === '#') {
            neighbors.push([newRow, newCol, dr / 2, dc / 2]);
          }
        }
        
        if (neighbors.length > 0) {
          // Choose a random neighbor
          const randomIndex = Math.floor(Math.random() * neighbors.length);
          const [nextRow, nextCol, wallRowOffset, wallColOffset] = neighbors[randomIndex];
          
          // Remove the wall between current and next
          const wallRow = currentRow + wallRowOffset;
          const wallCol = currentCol + wallColOffset;
          newMaze.grid[wallRow][wallCol] = ' ';
          
          // Mark the chosen neighbor as visited
          newMaze.grid[nextRow][nextCol] = ' ';
          
          // Push the neighbor to the stack
          stack.push([nextRow, nextCol]);
        } else {
          // Backtrack
          stack.pop();
        }
      }
      
      // Set entrance and exit
      newMaze.grid[1][1] = 'S';
      newMaze.grid[height - 2][width - 2] = 'E';
      
      setMaze(newMaze);
      setIsGenerating(false);
    }, 10);
  }, [width, height]);

  // Helper function for converting positions to string keys for sets
  const posToString = (pos) => `${pos[0]},${pos[1]}`;
  const stringToPos = (str) => str.split(',').map(Number);

  // BFS Algorithm with visualization
  const solveBFS = useCallback(() => {
    if (!maze) return null;
    
    const queue = [{ position: maze.start, path: [maze.start] }];
    const visited = new Set([posToString(maze.start)]);
    const allSteps = []; // Store all steps for animation
    
    while (queue.length > 0) {
      const { position, path } = queue.shift();
      const [row, col] = position;
      
      // Record this step for animation
      allSteps.push({
        currentPosition: position,
        currentPath: [...path],
        visited: new Set(visited)
      });
      
      if (row === maze.end[0] && col === maze.end[1]) {
        return { finalPath: path, steps: allSteps };
      }
      
      // Explore neighbors (up, right, down, left)
      for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const newRow = row + dr;
        const newCol = col + dc;
        const newPosition = [newRow, newCol];
        const posKey = posToString(newPosition);
        
        if (0 <= newRow && newRow < maze.height && 0 <= newCol && newCol < maze.width && 
            maze.grid[newRow][newCol] !== '#' && !visited.has(posKey)) {
          visited.add(posKey);
          queue.push({ position: newPosition, path: [...path, newPosition] });
        }
      }
    }
    
    return { finalPath: null, steps: allSteps };
  }, [maze]);

  // DFS Algorithm with visualization
  const solveDFS = useCallback(() => {
    if (!maze) return null;
    
    const stack = [{ position: maze.start, path: [maze.start] }];
    const visited = new Set([posToString(maze.start)]);
    const allSteps = []; // Store all steps for animation
    
    while (stack.length > 0) {
      const { position, path } = stack.pop();
      const [row, col] = position;
      
      // Record this step for animation
      allSteps.push({
        currentPosition: position,
        currentPath: [...path],
        visited: new Set(visited)
      });
      
      if (row === maze.end[0] && col === maze.end[1]) {
        return { finalPath: path, steps: allSteps };
      }
      
      // Explore neighbors (up, right, down, left)
      for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const newRow = row + dr;
        const newCol = col + dc;
        const newPosition = [newRow, newCol];
        const posKey = posToString(newPosition);
        
        if (0 <= newRow && newRow < maze.height && 0 <= newCol && newCol < maze.width && 
            maze.grid[newRow][newCol] !== '#' && !visited.has(posKey)) {
          visited.add(posKey);
          stack.push({ position: newPosition, path: [...path, newPosition] });
        }
      }
    }
    
    return { finalPath: null, steps: allSteps };
  }, [maze]);

  // A* Algorithm with visualization
  const solveAStar = useCallback(() => {
    if (!maze) return null;
    
    // Manhattan distance heuristic
    const heuristic = (pos) => {
      return Math.abs(pos[0] - maze.end[0]) + Math.abs(pos[1] - maze.end[1]);
    };
    
    const openSet = [{ 
      fScore: heuristic(maze.start), 
      gScore: 0, 
      position: maze.start, 
      path: [maze.start] 
    }];
    const closedSet = new Set();
    const gScores = { [posToString(maze.start)]: 0 };
    const allSteps = []; // Store all steps for animation
    
    while (openSet.length > 0) {
      // Find node with lowest fScore
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift();
      const currentKey = posToString(current.position);
      
      // Record this step for animation
      allSteps.push({
        currentPosition: current.position,
        currentPath: [...current.path],
        visited: new Set(closedSet)
      });
      
      if (current.position[0] === maze.end[0] && current.position[1] === maze.end[1]) {
        return { finalPath: current.path, steps: allSteps };
      }
      
      if (closedSet.has(currentKey)) {
        continue;
      }
      
      closedSet.add(currentKey);
      
      const [row, col] = current.position;
      for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const newRow = row + dr;
        const newCol = col + dc;
        const neighbor = [newRow, newCol];
        const neighborKey = posToString(neighbor);
        
        if (0 <= newRow && newRow < maze.height && 0 <= newCol && newCol < maze.width && 
            maze.grid[newRow][newCol] !== '#') {
          
          const tentativeGScore = current.gScore + 1;
          
          if (!closedSet.has(neighborKey) && 
              (!gScores[neighborKey] || tentativeGScore < gScores[neighborKey])) {
            
            gScores[neighborKey] = tentativeGScore;
            const fScore = tentativeGScore + heuristic(neighbor);
            
            openSet.push({
              fScore,
              gScore: tentativeGScore,
              position: neighbor,
              path: [...current.path, neighbor]
            });
          }
        }
      }
    }
    
    return { finalPath: null, steps: allSteps };
  }, [maze]);

  // Animate the solution step by step
  const animateSolution = useCallback((steps, finalPath) => {
    clearAnimations();
    setVisitedCells(new Set());
    setCurrentPath([]);
    
    const totalSteps = steps.length;
    let currentStep = 0;
    
    const animate = () => {
      if (currentStep < totalSteps) {
        const step = steps[currentStep];
        setVisitedCells(new Set([...step.visited].map(pos => pos)));
        setCurrentPath(step.currentPath);
        currentStep++;
        animationRef.current = setTimeout(animate, 1000 / animationSpeed);
      } else {
        // Animation complete, show final path
        setFinalPath(finalPath);
        setIsSolving(false);
      }
    };
    
    animate();
  }, [animationSpeed]);

  // Solve the maze and visualize or just get the solution
  const solveMaze = useCallback(() => {
    if (!maze) return;
    
    clearAnimations();
    setIsSolving(true);
    setFinalPath(null);
    setCurrentPath([]);
    setVisitedCells(new Set());
    
    const startTime = performance.now();
    
    let solveResult;
    if (algorithm === 'bfs') {
      solveResult = solveBFS();
    } else if (algorithm === 'dfs') {
      solveResult = solveDFS();
    } else if (algorithm === 'astar') {
      solveResult = solveAStar();
    }
    
    const endTime = performance.now();
    
    if (solveResult && solveResult.finalPath) {
      setStats({
        pathLength: solveResult.finalPath.length,
        solveTime: ((endTime - startTime) / 1000).toFixed(4),
        visitedCells: solveResult.steps.length
      });
      
      if (showAnimation) {
        // Animate the solution process
        animateSolution(solveResult.steps, solveResult.finalPath);
      } else {
        // Just show the final solution
        setFinalPath(solveResult.finalPath);
        setIsSolving(false);
      }
    } else {
      setIsSolving(false);
    }
  }, [maze, algorithm, solveBFS, solveDFS, solveAStar, animateSolution, showAnimation]);
  
  // Component cleanup
  useEffect(() => {
    return () => clearAnimations();
  }, []);
  
  useEffect(() => {
    // Initial maze generation
    if (!maze) {
      generateMaze();
    }
  }, [maze, generateMaze]);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-16">Maze Generator & Solver</h1>
      <div className='flex gap-4'>
        
        <div className="mb-6 bg-white p-4 rounded shadow w-full max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width:</label>
              <input 
                type="number" 
                min="5"
                max="51"
                step="2" 
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height:</label>
              <input 
                type="number" 
                min="5"
                max="51"
                step="2" 
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm:</label>
              <select 
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="bfs">BFS (Breadth-First Search)</option>
                <option value="dfs">DFS (Depth-First Search)</option>
                <option value="astar">A* Algorithm</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Animation Speed:</label>
              <input
                type="range"
                min="1"
                max="50"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showAnimation"
                checked={showAnimation}
                onChange={(e) => setShowAnimation(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showAnimation" className="text-sm font-medium text-gray-700">
                Show step-by-step animation
              </label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={generateMaze} 
              disabled={isGenerating}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300"
            >
              {isGenerating ? 'Generating...' : 'Generate New Maze'}
            </button>
            <button 
              onClick={solveMaze} 
              disabled={!maze || isSolving}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:bg-green-300"
            >
              {isSolving ? 'Solving...' : `Solve with ${algorithm.toUpperCase()}`}
            </button>
          </div>
          
          {(finalPath || isSolving) && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">Solution Stats:</h3>
              {finalPath && <p>Final path length: {stats.pathLength} steps</p>}
              {finalPath && <p>Solving time: {stats.solveTime} seconds</p>}
              {isSolving ? <p>Exploring maze... Please wait</p> : null}
            </div>
          )}
        </div>
        
        <div className="overflow-auto p-4 bg-white rounded shadow">
          {maze && (
            <div className="inline-block">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 mr-2"></div>
                  <span className="text-sm">Start</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 mr-2"></div>
                  <span className="text-sm">End</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-300 mr-2"></div>
                  <span className="text-sm">Current Path</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                  <span className="text-sm">Final Path</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 mr-2"></div>
                  <span className="text-sm">Visited</span>
                </div>
              </div>
              
              {maze.grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((cell, colIndex) => {
                    const pos = [rowIndex, colIndex];
                    const posKey = posToString(pos);
                    // Check if the cell is on the current exploring path
                    const isOnCurrentPath = currentPath.some(
                      ([r, c]) => r === rowIndex && c === colIndex
                    );
                    // Check if the cell is on the final solution path
                    const isOnFinalPath = finalPath && finalPath.some(
                      ([r, c]) => r === rowIndex && c === colIndex
                    );
                    // Check if the cell has been visited during exploration
                    const isVisited = visitedCells.has(posKey);
                    
                    return (
                      <Cell 
                        key={`${rowIndex}-${colIndex}`} 
                        type={cell} 
                        isPath={isOnFinalPath && cell !== 'S' && cell !== 'E'} 
                        isVisited={isVisited && !isOnCurrentPath && !isOnFinalPath && cell !== 'S' && cell !== 'E'}
                        isCurrentPath={isOnCurrentPath && !isOnFinalPath && cell !== 'S' && cell !== 'E'}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>  
    </div>
  );
};

export default App;
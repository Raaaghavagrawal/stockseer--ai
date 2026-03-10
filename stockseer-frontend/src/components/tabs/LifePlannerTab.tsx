import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { lifePlannerAPI } from '../../utils/api';

interface LifePlannerGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  risk_tolerance: 'Low' | 'Medium' | 'High';
  investment_strategy: string;
}

export default function LifePlannerTab() {
  const [goals, setGoals] = useState<LifePlannerGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    monthly_contribution: 0,
    risk_tolerance: 'Medium' as 'Low' | 'Medium' | 'High',
    investment_strategy: 'Diversified'
  });

  // Fetch real goals data
  const fetchGoals = async () => {
    try {
      const data = await lifePlannerAPI.getGoals();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setGoals([]);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const addGoal = async () => {
    if (newGoal.name && newGoal.target_amount > 0) {
      try {
        await lifePlannerAPI.createGoal(newGoal);
        setNewGoal({
          name: '',
          target_amount: 0,
          current_amount: 0,
          target_date: '',
          monthly_contribution: 0,
          risk_tolerance: 'Medium',
          investment_strategy: 'Diversified'
        });
        setShowAddForm(false);
        fetchGoals(); // Refresh the goals list
      } catch (error) {
        console.error('Error creating goal:', error);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await lifePlannerAPI.deleteGoal(id);
      fetchGoals(); // Refresh the goals list
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const calculateProgress = (goal: LifePlannerGoal) => {
    return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  };

  const calculateYearsToTarget = (goal: LifePlannerGoal) => {
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, diffYears);
  };

  const calculateRequiredReturn = (goal: LifePlannerGoal) => {
    const yearsToTarget = calculateYearsToTarget(goal);
    if (yearsToTarget === 0) return 0;
    
    const monthlyRate = Math.pow(
      goal.target_amount / (goal.current_amount + (goal.monthly_contribution * 12 * yearsToTarget)),
      1 / (yearsToTarget * 12)
    ) - 1;
    
    return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
  };

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🎯 Life Financial Planner</h2>
            <p className="text-slate-400">Plan and track your financial goals</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{goals.length}</div>
          <div className="text-slate-400 text-sm">Active Goals</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">${(totalTargetAmount / 1000).toFixed(0)}K</div>
          <div className="text-slate-400 text-sm">Total Target</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{totalProgress.toFixed(1)}%</div>
          <div className="text-slate-400 text-sm">Overall Progress</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {Math.round(goals.reduce((sum, goal) => sum + calculateYearsToTarget(goal), 0) / Math.max(goals.length, 1))}
          </div>
          <div className="text-slate-400 text-sm">Avg Years Left</div>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Add New Financial Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Goal Name"
              value={newGoal.name}
              onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Target Amount"
              value={newGoal.target_amount || ''}
              onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: parseFloat(e.target.value) || 0 }))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Current Amount"
              value={newGoal.current_amount || ''}
              onChange={(e) => setNewGoal(prev => ({ ...prev, current_amount: parseFloat(e.target.value) || 0 }))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
            />
            <input
              type="date"
              value={newGoal.target_date}
              onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Monthly Contribution"
              value={newGoal.monthly_contribution || ''}
              onChange={(e) => setNewGoal(prev => ({ ...prev, monthly_contribution: parseFloat(e.target.value) || 0 }))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
            />
            <select
              value={newGoal.risk_tolerance}
              onChange={(e) => setNewGoal(prev => ({ ...prev, risk_tolerance: e.target.value as 'Low' | 'Medium' | 'High' }))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
            >
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
          <div className="flex space-x-2 mt-4">
            <button onClick={addGoal} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
              Add Goal
            </button>
            <button onClick={() => setShowAddForm(false)} className="border border-slate-600 text-slate-300 hover:bg-slate-600 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{goal.name}</h3>
                <p className="text-slate-400">Target: ${goal.target_amount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => deleteGoal(goal.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Progress</div>
                <div className="text-2xl font-bold text-white">{calculateProgress(goal).toFixed(1)}%</div>
                <div className="text-slate-400 text-sm">
                  ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Years to Target</div>
                <div className="text-2xl font-bold text-white">{calculateYearsToTarget(goal).toFixed(1)}</div>
                <div className="text-slate-400 text-sm">Target: {new Date(goal.target_date).toLocaleDateString()}</div>
              </div>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Required Return</div>
                <div className="text-2xl font-bold text-white">{calculateRequiredReturn(goal).toFixed(1)}%</div>
                <div className="text-slate-400 text-sm">Annual</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Goal Details</h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Monthly Contribution: ${goal.monthly_contribution.toLocaleString()}</p>
                  <p>• Risk Tolerance: {goal.risk_tolerance}</p>
                  <p>• Strategy: {goal.investment_strategy}</p>
                </div>
              </div>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Progress Bar</h4>
                <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(goal)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-400">
                  {calculateProgress(goal).toFixed(1)}% complete
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No financial goals set yet. Add your first goal to get started!</p>
        </div>
      )}
    </div>
  );
}

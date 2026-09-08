import React, { useState, useMemo } from 'react';
import { Recipe, ExperimentLog, CraftMode } from '../types';
import { BookOpen, History, Sparkles, AlertTriangle, ArrowRight, Search, X } from 'lucide-react';

interface Props {
  mode: CraftMode;
  discoveredRecipes: Recipe[];
  allRecipes: Recipe[];
  experimentHistory: ExperimentLog[];
  onAutoFillRecipe: (recipe: Recipe) => void;
}

export const RecipeBook: React.FC<Props> = ({
  mode,
  discoveredRecipes,
  allRecipes,
  experimentHistory,
  onAutoFillRecipe
}) => {
  const [activeTab, setActiveTab] = useState<'receitas' | 'historico'>('receitas');
  const [recipeFilter, setRecipeFilter] = useState('');

  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Filter and sort discovered recipes (pergaminhos) alphabetically
  const sortedDiscoveredRecipes = useMemo(() => {
    let list = discoveredRecipes;
    if (recipeFilter.trim()) {
      const term = normalize(recipeFilter);
      list = list.filter(r =>
        normalize(r.name).includes(term) ||
        normalize(r.effect).includes(term) ||
        normalize(r.category).includes(term) ||
        r.ingredients.some(ing => normalize(ing).includes(term))
      );
    }
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [discoveredRecipes, recipeFilter]);

  return (
    <aside 
      aria-label="Grimório de Descobertas e Registro Alquímico"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #1f1813 0%, #15100d 100%)',
        border: '1px solid #4a382a',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.7)',
        position: 'relative'
      }}
    >
      {/* Book Cover Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          color: '#f5edd6',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📜</span> {mode === 'alquimia' ? 'Grimório de Alquimia' : 'Livro de Receitas do Chef'}
        </h2>
        <span style={{ fontSize: '0.74rem', color: '#c59341', background: '#1c1510', padding: '2px 8px', borderRadius: '10px', border: '1px solid #423224', fontWeight: 600 }}>
          {discoveredRecipes.length} / {allRecipes.length}
        </span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #3d2d21',
        marginBottom: '10px',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('receitas')}
          style={{
            flex: '1',
            padding: '7px 10px',
            background: activeTab === 'receitas' ? '#2b2018' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'receitas' ? '2px solid #c59341' : '2px solid transparent',
            color: activeTab === 'receitas' ? '#f5edd6' : '#8c7a68',
            fontFamily: 'var(--font-display)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <BookOpen size={14} />
          Descobertas ({discoveredRecipes.length})
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          style={{
            flex: '1',
            padding: '7px 10px',
            background: activeTab === 'historico' ? '#2b2018' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'historico' ? '2px solid #c59341' : '2px solid transparent',
            color: activeTab === 'historico' ? '#f5edd6' : '#8c7a68',
            fontFamily: 'var(--font-display)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <History size={14} />
          Histórico ({experimentHistory.length})
        </button>
      </div>

      {/* Search Input for Scrolls / Recipes (if player has discovered recipes) */}
      {activeTab === 'receitas' && discoveredRecipes.length > 2 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#14100d',
          border: '1px solid #3d2c20',
          borderRadius: '5px',
          padding: '4px 8px',
          marginBottom: '10px',
          gap: '6px'
        }}>
          <Search size={13} color="#8c7a68" />
          <input
            type="text"
            value={recipeFilter}
            onChange={e => setRecipeFilter(e.target.value)}
            placeholder="Filtrar pergaminhos / receitas..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#f5edd6',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-ui)',
              outline: 'none'
            }}
          />
          {recipeFilter && (
            <button
              type="button"
              onClick={() => setRecipeFilter('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8c7a68',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Limpar busca"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div 
        tabIndex={0}
        aria-label="Lista de registros do grimório"
        style={{
          flex: '1',
          overflowY: 'auto',
          paddingRight: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {activeTab === 'receitas' ? (
          discoveredRecipes.length > 0 ? (
            sortedDiscoveredRecipes.length > 0 ? (
              sortedDiscoveredRecipes.map(recipe => (
              <div
                key={recipe.id}
                style={{
                  background: 'linear-gradient(180deg, #ede1cb 0%, #e2d4bc 100%)',
                  color: '#2b221a',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #bda889',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#211710'
                  }}>
                    {recipe.name}
                  </h4>
                  <span style={{
                    fontSize: '0.64rem',
                    background: '#2b221a',
                    color: '#e5dec9',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {recipe.category}
                  </span>
                </div>

                <p style={{
                  fontSize: '0.78rem',
                  color: '#3d3024',
                  lineHeight: '1.35',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-ui)'
                }}>
                  {recipe.effect}
                </p>

                {/* Required Ingredients Badge */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  marginBottom: '8px'
                }}>
                  {recipe.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.68rem',
                        background: 'rgba(0,0,0,0.08)',
                        color: '#423326',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>

                {/* Repeat / Autofill button */}
                <button
                  onClick={() => onAutoFillRecipe(recipe)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#2b2118',
                    color: '#f5edd6',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  <Sparkles size={13} color="#facc15" />
                  Carregar no Caldeirão
                </button>
              </div>
            ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: '#8a7866'
              }}>
                <Search size={22} color="#c59341" style={{ marginBottom: '8px' }} />
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: '#f5edd6', marginBottom: '4px' }}>
                  Nenhum pergaminho encontrado
                </p>
                <p style={{ fontSize: '0.74rem', color: '#a89885', marginBottom: '10px' }}>
                  Nenhuma receita bate com o termo "{recipeFilter}".
                </p>
                <button
                  type="button"
                  onClick={() => setRecipeFilter('')}
                  style={{
                    background: '#2b2018',
                    border: '1px solid #4a382a',
                    color: '#c59341',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)'
                  }}
                >
                  Limpar busca
                </button>
              </div>
            )
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 16px',
              color: '#8a7866'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧪✨</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: '#c59341', marginBottom: '6px' }}>
                Nenhuma receita descoberta ainda
              </p>
              <p style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                Combine ingredientes livremente no caldeirão para desvendar fórmulas secretas de {mode === 'alquimia' ? 'alquimia' : 'culinária mágica'}!
              </p>
            </div>
          )
        ) : (
          /* Historico Tab */
          experimentHistory.length > 0 ? (
            experimentHistory.map(exp => (
              <div
                key={exp.id}
                style={{
                  background: exp.isSuccess ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${exp.isSuccess ? '#166534' : '#7f1d1d'}`,
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    color: exp.isSuccess ? '#4ade80' : '#f87171'
                  }}>
                    {exp.isSuccess ? <Sparkles size={13} /> : <AlertTriangle size={13} />}
                    {exp.isSuccess ? exp.resultName : 'Mistura Instável'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#8c7d6d' }}>{exp.timestamp}</span>
                </div>

                <div style={{ color: '#d4c7b2', fontSize: '0.74rem', marginBottom: '4px' }}>
                  <b>Reagentes:</b> {exp.ingredients.join(' + ')}
                </div>

                {exp.effect && (
                  <p style={{ color: '#a39281', fontSize: '0.72rem', fontStyle: 'italic' }}>
                    "{exp.effect}"
                  </p>
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 16px', color: '#8a7866' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📝</div>
              <p style={{ fontSize: '0.8rem' }}>Suas tentativas de mistura serão registradas aqui em tempo real durante a sessão de RPG.</p>
            </div>
          )
        )}
      </div>
    </aside>
  );
};

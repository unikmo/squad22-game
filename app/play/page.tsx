'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getSquad22Card } from '@/lib/squad22/deck';
import {
  calculateRoundScore,
  createMatch,
  discardAndPass,
  drawFromOpenPile,
  drawFromPile,
  legalMoves,
  openPileTakeOptions,
  playMove,
  startNextRound,
  tablePoints,
  type Formation,
  type HandSize,
  type LegalMove,
  type MatchState,
  type TargetScore,
} from '@/lib/squad22/engine';
import { runAiTurn } from '@/lib/squad22/ai';
import {
  clearCloudPointer,
  clearLocalMatch,
  loadLocalMatch,
  saveLocalMatch,
  saveMatchCloud,
  type SaveStatus,
} from '@/lib/squad22/persistence';
import styles from './play.module.css';

const POSITIONS = [1,2,3,4,5,6,7,8,9,10,11] as const;
const cardImage = (id:number) => `/images/cards/${String(id).padStart(2,'0')}.webp`;

function CardFace({id,selected=false,small=false,hidden=false,onClick,disabled,badge}:{id:number;selected?:boolean;small?:boolean;hidden?:boolean;onClick?:()=>void;disabled?:boolean;badge?:string}) {
  const card=getSquad22Card(id);
  if(hidden) return <div className={`${styles.card} ${small?styles.cardSmall:''}`} aria-label="Hidden opponent card"><Image src="/images/card-back.webp" alt="" fill sizes="90px" /></div>;
  const className=`${styles.card} ${small?styles.cardSmall:''} ${selected?styles.cardSelected:''} ${disabled?styles.cardDisabled:''}`;
  const contents=<><Image src={cardImage(id)} alt={card.name} fill sizes={small?'62px':'110px'} />{badge?<span className={styles.cardBadge}>{badge}</span>:null}</>;
  const label=`${card.name}${card.position?`, position ${card.position}`:''}`;
  if(onClick) return <button type="button" onClick={onClick} disabled={disabled} className={className} aria-label={label}>{contents}</button>;
  return <div className={className} aria-label={label}>{contents}</div>;
}

function Slot({position,cards,globalOpen,compact=false}:{position:number;cards:number[];globalOpen:boolean;compact?:boolean}) {
  return <div className={`${styles.slot} ${compact?styles.slotCompact:''} ${globalOpen?styles.slotGlobal:''} ${cards.length===2?styles.slotComplete:''}`} data-position={position}>
    <span className={styles.slotNumber}>{position}</span>
    {cards.length===0?<div className={styles.emptySlot}><span>{globalOpen?'GLOBAL':'OPEN'}</span></div>:<div className={styles.slotCards}>{cards.map((id,index)=><CardFace key={`${position}-${id}-${index}`} id={id} small />)}</div>}
  </div>;
}

function Pitch({state,playerIndex,compact=false}:{state:MatchState;playerIndex:0|1;compact?:boolean}) {
  const player=state.players[playerIndex];
  const globalSet=new Set(state.globalOpenPositions);
  return <div className={`${styles.pitch} ${compact?styles.pitchCompact:''}`}>
    <span className={styles.pitchHalfway}/><span className={styles.pitchCircle}/><span className={styles.goalTop}/><span className={styles.goalBottom}/>
    <div className={styles.pitchSlots}>{POSITIONS.map(position=>{const slot=player.squad.find(candidate=>candidate.position===position);return <Slot key={position} position={position} cards={slot?.cards??[]} globalOpen={globalSet.has(position)} compact={compact}/>;})}</div>
    <div className={styles.staffRail}><span>STAFF</span>{[0,1,2].map(index=>player.staff[index]?<CardFace key={player.staff[index]} id={player.staff[index]} small/>:<div className={styles.staffEmpty} key={index}>+</div>)}</div>
  </div>;
}

function Setup({onStart,saved,onResume}:{onStart:(settings:{name:string;formation:Formation;handSize:HandSize;targetScore:TargetScore})=>void;saved:MatchState|null;onResume:()=>void}) {
  const [name,setName]=useState('');
  const [formation,setFormation]=useState<Formation>('4-4-2');
  const [handSize,setHandSize]=useState<HandSize>(7);
  const [targetScore,setTargetScore]=useState<TargetScore>(300);
  return <main className={styles.setupPage}>
    <div className={styles.setupGlow}/>
    <header className={styles.setupNav}><Link href="/" className={styles.brand}><Image src="/images/logo.webp" alt="Squad22" width={44} height={44}/><span>SQUAD22</span></Link><Link href="/game">Tactical demo</Link></header>
    <section className={styles.setupHero}><p className={styles.kicker}>FULL MATCH · SOLO VS AI</p><h1>Pick the shape.<br/><span>Then own the table.</span></h1><p>Play the complete round structure against The Gaffer: draw, read the Open Pile, build your squad and race to the target score.</p></section>
    <section className={styles.setupPanel}>
      {saved&&saved.phase!=='match-end'?<button className={styles.resumeCard} onClick={onResume}><span>RESUME MATCH</span><strong>Round {saved.round} · {saved.players[0].totalScore}–{saved.players[1].totalScore}</strong><small>{saved.formation} · first to {saved.targetScore}</small><b>Continue →</b></button>:null}
      <div className={styles.setupGrid}>
        <label className={styles.field}><span>Squad name</span><input value={name} onChange={event=>setName(event.target.value.slice(0,24))} placeholder="Your squad"/></label>
        <div className={styles.field}><span>Formation</span><div className={styles.segmented}>{(['4-4-2','4-3-3','3-5-2','5-3-2'] as Formation[]).map(value=><button key={value} onClick={()=>setFormation(value)} className={formation===value?styles.activeSegment:''}>{value}</button>)}</div></div>
        <div className={styles.field}><span>Starting hand</span><div className={styles.segmented}>{([5,7] as HandSize[]).map(value=><button key={value} onClick={()=>setHandSize(value)} className={handSize===value?styles.activeSegment:''}>{value} cards</button>)}</div></div>
        <div className={styles.field}><span>Target score</span><div className={styles.segmented}>{([300,500,600] as TargetScore[]).map(value=><button key={value} onClick={()=>setTargetScore(value)} className={targetScore===value?styles.activeSegment:''}>{value}</button>)}</div></div>
      </div>
      <button className={styles.kickoff} onClick={()=>onStart({name,formation,handSize,targetScore})}>KICK OFF →</button><p className={styles.betaNote}>Full-match beta · payments are not active.</p>
    </section>
  </main>;
}

function RoundModal({state,onNext,onNew}:{state:MatchState;onNext:()=>void;onNew:()=>void}) {
  const human=calculateRoundScore(state.players[0]); const ai=calculateRoundScore(state.players[1]); const ended=state.phase==='match-end';
  return <div className={styles.modalBackdrop}><section className={styles.roundModal}>
    <p>{ended?'FULL TIME':`ROUND ${state.round} COMPLETE`}</p><h2>{ended?(state.winner===0?'You won the match.':'The Gaffer got you.'):state.roundReason}</h2>
    <div className={styles.roundScoreBig}><strong>{state.players[0].totalScore}</strong><span>–</span><strong>{state.players[1].totalScore}</strong></div>
    <div className={styles.scoreBreakdown}><div><b>{state.players[0].name}</b><span>Table +{human.table}</span><span>Hand {human.handPenalty}</span><span>Full squad +{human.fullSquadBonus}</span><strong>Round {human.net>=0?'+':''}{human.net}</strong></div><div><b>The Gaffer</b><span>Table +{ai.table}</span><span>Hand {ai.handPenalty}</span><span>Full squad +{ai.fullSquadBonus}</span><strong>Round {ai.net>=0?'+':''}{ai.net}</strong></div></div>
    {ended?<button className={styles.primaryAction} onClick={onNew}>New match</button>:<button className={styles.primaryAction} onClick={onNext}>Next round →</button>}
  </section></div>;
}

export default function FullMatchPage(){
  const [savedAtLoad,setSavedAtLoad]=useState<MatchState|null>(null);
  const [state,setState]=useState<MatchState|null>(null);
  const [selected,setSelected]=useState<number[]>([]);
  const [targetPosition,setTargetPosition]=useState<number|undefined>();
  const [discardMode,setDiscardMode]=useState(false);
  const [message,setMessage]=useState('');
  const [aiThinking,setAiThinking]=useState(false);
  const [saveStatus,setSaveStatus]=useState<SaveStatus>('idle');

  const humanMoves=useMemo(()=>state&&state.currentPlayer===0&&state.phase==='play'?legalMoves(state,0):[],[state]);
  const openOptions=useMemo(()=>state&&state.currentPlayer===0&&state.phase==='draw'?openPileTakeOptions(state,0):[],[state]);
  const selectedCandidates=useMemo(()=>{if(!state||!selected.length)return [] as LegalMove[];const sorted=[...selected].sort((a,b)=>a-b);return humanMoves.filter(move=>{const ids=[...move.cardIds].sort((a,b)=>a-b);return ids.length===sorted.length&&ids.every((id,index)=>id===sorted[index]);});},[state,selected,humanMoves]);
  const flexNeedsTarget=selectedCandidates.length>1&&selectedCandidates.every(move=>move.type==='flex');
  const chosenMove=flexNeedsTarget&&targetPosition===undefined?null:selectedCandidates.find(move=>targetPosition===undefined||move.position===targetPosition)??(selectedCandidates.length===1?selectedCandidates[0]:null);

  useEffect(()=>{setSavedAtLoad(loadLocalMatch());},[]);
  useEffect(()=>{if(!state)return;saveLocalMatch(state);const handle=window.setTimeout(async()=>{const result=await saveMatchCloud(state);setSaveStatus(result.status);},650);return()=>window.clearTimeout(handle);},[state]);
  useEffect(()=>{if(!state||state.currentPlayer!==1||!['draw','play'].includes(state.phase))return;setAiThinking(true);const timer=window.setTimeout(()=>{try{setState(current=>current?runAiTurn(current):current);}catch(error){setMessage(error instanceof Error?error.message:'AI turn failed');}finally{setAiThinking(false);}},850);return()=>window.clearTimeout(timer);},[state?.currentPlayer,state?.phase,state?.updatedAt]);

  const resetSelection=()=>{setSelected([]);setTargetPosition(undefined);setDiscardMode(false);};
  const newMatch=(settings:{name:string;formation:Formation;handSize:HandSize;targetScore:TargetScore})=>{clearLocalMatch();clearCloudPointer();setState(createMatch({playerName:settings.name,formation:settings.formation,handSize:settings.handSize,targetScore:settings.targetScore}));resetSelection();setMessage('');};
  if(!state)return <Setup saved={savedAtLoad} onResume={()=>setState(savedAtLoad)} onStart={newMatch}/>;

  const human=state.players[0],ai=state.players[1];
  const humanTurn=state.currentPlayer===0;
  const canInteract=humanTurn&&!aiThinking&&!['round-end','match-end'].includes(state.phase);
  const optionIndexes=new Set(openOptions.map(option=>option.index));
  const eventLines=[...state.events].reverse().slice(0,5);

  const toggleCard=(id:number)=>{if(!canInteract||state.phase!=='play')return;if(discardMode){try{setState(discardAndPass(state,id));resetSelection();}catch(error){setMessage(error instanceof Error?error.message:'Cannot discard that card');}return;}setSelected(current=>current.includes(id)?current.filter(item=>item!==id):current.length<3?[...current,id]:current);setTargetPosition(undefined);setMessage('');};
  const commitMove=()=>{if(!chosenMove)return;try{setState(playMove(state,chosenMove));resetSelection();setMessage('');}catch(error){setMessage(error instanceof Error?error.message:'Illegal move');}};
  const drawClosed=()=>{try{setState(drawFromPile(state));resetSelection();setMessage('');}catch(error){setMessage(error instanceof Error?error.message:'Cannot draw');}};
  const takeOpen=(index:number)=>{try{setState(drawFromOpenPile(state,index));resetSelection();setMessage('');}catch(error){setMessage(error instanceof Error?error.message:'That Open Pile card is not available');}};
  const nextRound=()=>{setState(startNextRound(state));resetSelection();};
  const abandon=()=>{clearLocalMatch();clearCloudPointer();setState(null);};

  return <main className={styles.gamePage}>
    <header className={styles.gameHeader}><Link href="/" className={styles.brand}><Image src="/images/logo.webp" alt="Squad22" width={36} height={36}/><span>SQUAD22</span></Link><div className={styles.matchMeta}><span>ROUND {state.round}</span><b>{state.formation}</b><span>FIRST TO {state.targetScore}</span></div><div className={styles.saveState}><i className={saveStatus==='cloud'?styles.cloudDot:styles.localDot}/>{saveStatus==='cloud'?'Cloud saved':'Saved locally'}</div></header>
    <section className={styles.scoreboard}><div className={styles.teamScore}><span>{human.name}</span><strong>{human.totalScore}</strong><small>table {tablePoints(human)}</small></div><div className={styles.scoreCenter}><span>{humanTurn?'YOUR TURN':'GAFFER THINKING'}</span><b>{state.phase==='draw'?'DRAW':state.phase==='play'?'PLAY':'ROUND'}</b></div><div className={`${styles.teamScore} ${styles.teamScoreAway}`}><span>THE GAFFER</span><strong>{ai.totalScore}</strong><small>table {tablePoints(ai)}</small></div></section>
    {state.globalOpenPositions.length?<div className={styles.globalBar}><span>GLOBAL OPEN</span>{state.globalOpenPositions.map(position=><b key={position}>{position}</b>)}<small>Either squad may start these positions with one matching card.</small></div>:<div className={styles.globalBarMuted}>No global positions yet · a Trait Triple changes the table for both sides.</div>}
    <section className={styles.arena}>
      <aside className={styles.opponentPanel}><div className={styles.panelTitle}><span>THE GAFFER</span><b>{ai.hand.length} cards</b></div><div className={styles.opponentHand}>{ai.hand.slice(0,7).map((id,index)=><CardFace key={`${id}-${index}`} id={id} small hidden/>)}</div><Pitch state={state} playerIndex={1} compact/></aside>
      <section className={styles.tableZone}>
        <div className={styles.piles}><button className={`${styles.drawPile} ${state.phase==='draw'&&canInteract?styles.pileActive:''}`} onClick={drawClosed} disabled={!canInteract||state.phase!=='draw'}><div className={styles.stackCards}><Image src="/images/card-back.webp" alt="Draw pile" fill sizes="100px"/></div><strong>{state.drawPile.length}</strong><span>DRAW PILE</span><small>Take 1</small></button><div className={styles.openPileWrap}><div className={styles.openPileLabel}><strong>OPEN PILE</strong><span>bottom → top</span></div><div className={styles.openPile}>{state.openPile.slice(-7).map((id,localIndex)=>{const absoluteIndex=Math.max(0,state.openPile.length-7)+localIndex;const legal=optionIndexes.has(absoluteIndex);const takeCount=state.openPile.length-absoluteIndex;return <CardFace key={`${id}-${absoluteIndex}`} id={id} small disabled={!legal||!canInteract||state.phase!=='draw'} onClick={legal&&canInteract&&state.phase==='draw'?()=>takeOpen(absoluteIndex):undefined} badge={legal&&state.phase==='draw'?`TAKE ${takeCount}`:absoluteIndex===state.openPile.length-1?'TOP':undefined}/>;})}{!state.openPile.length?<div className={styles.emptyOpen}>EMPTY</div>:null}</div></div></div>
        <div className={styles.turnInstruction}><p>{aiThinking?'THE GAFFER IS READING THE TABLE':state.phase==='draw'?'CHOOSE ONE PILE':discardMode?'CHOOSE ONE CARD TO DISCARD':'BUILD YOUR SQUAD'}</p><h2>{aiThinking?'Thinking…':state.phase==='draw'?'Draw closed—or take a playable line from the Open Pile.':discardMode?'Your discard becomes the new top of the Open Pile.':'Select 1, 2 or 3 cards. Legal combinations reveal themselves.'}</h2>{message?<span className={styles.message}>{message}</span>:null}</div>
        <Pitch state={state} playerIndex={0}/>
      </section>
      <aside className={styles.matchFeed}><div className={styles.panelTitle}><span>MATCH FEED</span><b>LIVE</b></div><div className={styles.feedLines}>{eventLines.map(item=><div key={item.id}><i className={item.actor==='human'?styles.youEvent:item.actor==='ai'?styles.aiEvent:styles.systemEvent}/><p>{item.text}</p></div>)}</div><div className={styles.rulePulse}><span>THE TURN</span><b>1 · DRAW</b><b>2 · PLAY</b><b>3 · DISCARD</b></div><button className={styles.leaveButton} onClick={abandon}>Leave match</button></aside>
    </section>
    <section className={styles.handDock}><div className={styles.handTop}><div><span>YOUR HAND</span><b>{human.hand.length} cards</b></div>{state.phase==='play'&&canInteract?<div className={styles.handActions}><button className={discardMode?styles.activeTool:''} onClick={()=>{setDiscardMode(value=>!value);setSelected([]);setTargetPosition(undefined);}}>{discardMode?'Cancel discard':'Discard & end turn'}</button><button className={styles.playButton} onClick={commitMove} disabled={!chosenMove||discardMode}>{chosenMove?chosenMove.label:selected.length?'Not a legal move':'Select cards'} →</button></div>:null}</div>
      {flexNeedsTarget?<div className={styles.positionChooser}><span>Place Flex at:</span>{selectedCandidates.map(move=><button key={move.position} className={targetPosition===move.position?styles.positionChosen:''} onClick={()=>setTargetPosition(move.position)}>{move.position}</button>)}</div>:null}
      <div className={styles.handCards}>{human.hand.map((id,index)=><CardFace key={`${id}-${index}`} id={id} selected={selected.includes(id)} disabled={!canInteract||state.phase!=='play'} onClick={()=>toggleCard(id)} badge={discardMode?'DISCARD?':undefined}/>)}</div>
      <div className={styles.handLegend}><span><i className={styles.legendPair}/>Pair: 2 same position</span><span><i className={styles.legendTriple}/>Triple: 3 same colour, different positions</span><span><i className={styles.legendGlobal}/>Global: 1 matching card</span><span>{humanMoves.length} legal move{humanMoves.length===1?'':'s'} available</span></div>
    </section>
    {state.phase==='round-end'||state.phase==='match-end'?<RoundModal state={state} onNext={nextRound} onNew={abandon}/>:null}
  </main>;
}

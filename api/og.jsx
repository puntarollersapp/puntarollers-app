import React from 'react'
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default function handler() {
  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 72% 22%, #1f0b0d 0%, #090909 35%, #020202 74%)',
        color: 'white',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ position: 'absolute', inset: '18px', border: '1px solid rgba(255,255,255,.25)', borderRadius: '34px' }} />

      {[0,1,2,3,4,5,6].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${-180 + i * 34}px`,
            top: `${115 + i * 38}px`,
            width: `${570 - i * 44}px`,
            height: `${570 - i * 44}px`,
            border: `${i < 3 ? 6 : 3}px solid rgba(235,37,45,${0.72 - i * 0.07})`,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRadius: '50%',
            transform: 'rotate(-34deg)',
          }}
        />
      ))}

      <div style={{ position: 'relative', width: '660px', height: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '55px', width: '520px', height: '340px', border: '18px solid #d7a74c', borderBottomColor: 'transparent', borderLeftColor: '#c49238', borderRadius: '50%' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', fontSize: '260px', fontWeight: 1000, fontStyle: 'italic', letterSpacing: '-30px', lineHeight: .82, textShadow: '0 8px 22px rgba(0,0,0,.7)' }}>
          <span style={{ transform: 'skew(-8deg)', display: 'flex' }}>P</span>
          <span style={{ transform: 'skew(-8deg)', display: 'flex', marginLeft: '8px' }}>R</span>
          <span style={{ position: 'absolute', right: '50px', bottom: '42px', color: '#d6a13a', fontSize: '74px', transform: 'rotate(-9deg)', letterSpacing: '0' }}>⚡</span>
        </div>

        <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '24px', fontSize: '38px', fontWeight: 800, fontStyle: 'italic', letterSpacing: '9px' }}>
          <span style={{ width: '58px', height: '5px', background: '#d6a13a' }} />
          <span>PUNTA ROLLERS</span>
          <span style={{ width: '58px', height: '5px', background: '#d6a13a' }} />
        </div>

        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '24px', color: '#d6a13a', fontSize: '54px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '11px' }}>
          <span style={{ width: '86px', height: '4px', background: '#d6a13a' }} />
          <span>APP</span>
          <span style={{ width: '86px', height: '4px', background: '#d6a13a' }} />
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}

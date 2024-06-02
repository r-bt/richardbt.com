'use client'
/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.2.16 public/PirateShip.glb --transform 
Files: public/PirateShip.glb [2.82MB] > /Users/richard/Documents/richardbt.com/PirateShip-transformed.glb [262.27KB] (91%)
*/

import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Model(props) {
  const { nodes, materials } = useGLTF('/PirateShip-transformed.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Body5.geometry} material={materials.F_0c69f5944a6943b7a2dfedc4a420c4a4} scale={10} />
      <mesh geometry={nodes.Body2.geometry} material={materials.F_22c713df31ca4b00b96a801f0e3f8621_baked} scale={10} />
      <mesh geometry={nodes.Body2001.geometry} material={materials.F_c963edf34a5f451e8432064b23b97116} scale={10} />
      <mesh geometry={nodes.Body12.geometry} material={materials.F_88661b237f014002af052aeaebdb744e_baked} scale={10} />
      <mesh geometry={nodes.Body15.geometry} material={materials.F_1e0870be2b014dd0abe63ae47658e0c5} scale={10} />
    </group>
  )
}

useGLTF.preload('/PirateShip-transformed.glb')
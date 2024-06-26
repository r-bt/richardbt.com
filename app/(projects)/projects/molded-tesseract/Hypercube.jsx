'use client'
/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.2.16 public/Hypercube.glf --transform 
Files: public/Hypercube.glf [24.53KB] > /Users/richard/Documents/richardbt.com/Hypercube-transformed.glb [2.24KB] (91%)
*/

import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Model(props) {
  const { nodes, materials } = useGLTF('/Hypercube-transformed.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Body1.geometry} material={materials.F_a36a6f19125340dfb0791d69b9ac6c29} scale={10} />
    </group>
  )
}

useGLTF.preload('/Hypercube-transformed.glb')

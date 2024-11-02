// election-dashboard.tsx

'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, User, Clock } from 'lucide-react'

// Declare the Ethereum interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}

// Replace with your contract address and ABI
const CONTRACT_ADDRESS = '0xEd27133B24A9cDf08E2a9F05D4ba2B5f323E2dE1'
const CONTRACT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"string[]","name":"_candidateNames","type":"string[]"}],"name":"addCandidates","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_official","type":"address"}],"name":"addGovtOfficial","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"addVIN","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"candidates","outputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"voteCount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"electionEndTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"electionOngoing","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCandidates","outputs":[{"internalType":"string[]","name":"","type":"string[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLeadingCandidate","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVotes","outputs":[{"internalType":"string[]","name":"","type":"string[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_official","type":"address"}],"name":"removeGovtOfficial","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"resetCandidates","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"resetHasVoted","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"resetVotes","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_duration","type":"uint256"}],"name":"setElectionTime","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"verifyVoter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_candidateNumber","type":"uint256"}],"name":"vote","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  

export function ElectionDashboardComponent() {
  const [account, setAccount] = useState<string>('')
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [candidates, setCandidates] = useState<{ name: string; index: number }[]>([])
  const [votes, setVotes] = useState<{ name: string; votes: number }[]>([])
  const [leadingCandidate, setLeadingCandidate] = useState<{ name: string; votes: number }>({ name: '', votes: 0 })
  const [electionStatus, setElectionStatus] = useState({ ongoing: false, endTime: 0 })
  const [newCandidateName, setNewCandidateName] = useState('')
  const [newOfficialAddress, setNewOfficialAddress] = useState('')
  const [electionDuration, setElectionDuration] = useState('')
  const [voterVIN, setVoterVIN] = useState('')

  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const address = await signer.getAddress()
          setAccount(address)

          const electionContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
          setContract(electionContract)

          const owner = await electionContract.owner()
          setIsOwner(owner.toLowerCase() === address.toLowerCase())

          updateElectionInfo(electionContract)
        } catch (error) {
          console.error('Failed to connect wallet:', error)
        }
      } else {
        console.log('Please install MetaMask!')
      }
    }

    connectWallet()
  }, [])

  const updateElectionInfo = async (contract: ethers.Contract) => {
    const [candidateNames, candidateIndexes] = await contract.getCandidates()
    setCandidates(candidateNames.map((name: string, index: number) => ({ name, index: candidateIndexes[index].toNumber() })))

    const [voteNames, voteCounts] = await contract.getVotes()
    setVotes(voteNames.map((name: string, index: number) => ({ name, votes: voteCounts[index].toNumber() })))

    const [leadingName, leadingVotes] = await contract.getLeadingCandidate()
    setLeadingCandidate({ name: leadingName, votes: leadingVotes.toNumber() })

    const ongoing = await contract.electionOngoing()
    const endTime = await contract.electionEndTime()
    setElectionStatus({ ongoing, endTime: endTime.toNumber() })
  }

  const addCandidate = async () => {
    if (contract && newCandidateName) {
      try {
        await contract.addCandidates([newCandidateName])
        setNewCandidateName('')
        updateElectionInfo(contract)
      } catch (error) {
        console.error('Failed to add candidate:', error)
      }
    }
  }

  const addOfficial = async () => {
    if (contract && newOfficialAddress) {
      try {
        await contract.addGovtOfficial(newOfficialAddress)
        setNewOfficialAddress('')
      } catch (error) {
        console.error('Failed to add official:', error)
      }
    }
  }

  const setElectionTime = async () => {
    if (contract && electionDuration) {
      try {
        await contract.setElectionTime(parseInt(electionDuration))
        setElectionDuration('')
        updateElectionInfo(contract)
      } catch (error) {
        console.error('Failed to set election time:', error)
      }
    }
  }

  const verifyVoter = async () => {
    if (contract && voterVIN) {
      try {
        await contract.verifyVoter(parseInt(voterVIN))
        setVoterVIN('')
      } catch (error) {
        console.error('Failed to verify voter:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center bg-no-repeat">
      <div className="min-h-screen bg-green-900/70 text-white p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Nigerian Election Dashboard</h1>
          <p className="text-xl">Connected Account: {account ? account : 'Not Connected'}</p>
        </header>
        
        {account ? (
          <Tabs defaultValue="overview" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="voters">Voters</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Election Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-center space-x-2">
                      {electionStatus.ongoing ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>Election Status: {electionStatus.ongoing ? 'Ongoing' : 'Not Active'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>End Time: {new Date(electionStatus.endTime * 1000).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Leading Candidate: {leadingCandidate.name} ({leadingCandidate.votes} votes)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="candidates">
              <Card>
                <CardHeader>
                  <CardTitle>Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidates.map((candidate, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{candidate.name}</span>
                      <span>{votes.find(v => v.name === candidate.name)?.votes || 0} votes</span>
                    </div>
                  ))}
                </CardContent>
                {isOwner && (
                  <CardFooter>
                    <Input
                      placeholder="New Candidate Name"
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                    />
                    <Button onClick={addCandidate}>Add Candidate</Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="voters">
              <Card>
                <CardHeader>
                  <CardTitle>Voter Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Voter VIN"
                    value={voterVIN}
                    onChange={(e) => setVoterVIN(e.target.value)}
                  />
                  <Button onClick={verifyVoter}>Verify Voter</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Election Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  {isOwner && (
                    <>
                      <Input
                        type="number"
                        placeholder="Election Duration (minutes)"
                        value={electionDuration}
                        onChange={(e) => setElectionDuration(e.target.value)}
                      />
                      <Button onClick={setElectionTime}>Set Election Time</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}>
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

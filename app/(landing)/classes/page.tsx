import SideBar from "@/components/SideBar";
import Class from "@/components/Class";
import Semester from "@/components/Semester";

export default function Classes() {
  return (
    <>
      <Semester title="Fall 2024">
        <Class
          number="6.3900 (6.036)"
          title="Introduction to Machine Learning"
        />
        <Class number="6.S965" title="Digital Systems Laboratory II" />
        <Class number="17.561" title="European Politics" />
      </Semester>
      <Semester title="Spring 2024">
        <Class number="21M.370" title="Digital Instrument Design" />
        <Class
          number="6.2060 (6.115)"
          title="Microcomputer Project Laboratory"
        />
        <Class number="6.1800 (6.033)" title="Computer Systems Engineering" />
        <Class number="6.2080" title="Semiconductor Electronic Circuits" />
      </Semester>
      <Semester title="Fall 2023">
        <Class number="6.2050 (6.111)" title="Digital Systems Laboratory" />
        <Class
          number="CMS.S61"
          title="cs.forward(): Trace the Past to Plot the Future of K-12 CS Education"
        />
        <Class number="6.1210 (6.006)" title="Introduction to Algorithms" />
        <Class
          number="6.3100 (6.302)"
          title="Dynamical System Modeling and Control Design"
        />
      </Semester>
      <Semester title="Spring 2023">
        <Class number="18.06" title="Linear Algebra" />
        <Class number="6.2000 (6.002)" title="Electrical Circuits" />
        <Class
          number="6.1200 (6.042)"
          title="Mathematics for Computer Science"
        />
        <Class
          number="17.57"
          title="Soviet and Post-Soviet Politics and Society: 1917 to the Present"
        />
        <Class number="2.S007" title="Design and Manufacturing I" />
      </Semester>
      <Semester title="Fall 2022">
        <Class number="18.03" title="Differential Equations" />
        <Class number="6.9020 (6.943)" title="How to Make (Almost) Anything" />
        <Class number="6.1910 (6.004)" title="Computation Structures" />
        <Class number="2.001" title="Mechanics and Materials I" />
        <Class number="24.201" title="Topics in the History of Philosophy" />
      </Semester>
      <Semester title="Spring 2022">
        <Class number="9.00" title="Introduction to Psychological Science" />
        <Class number="2.00B" title="Toy Product Design" />
        <Class number="6.1010 (6.009)" title="Fundamentals of Programming" />
        <Class number="ES.100" title="An Introduction to Maker Skills" />
        <Class number="ES.802" title="Physics II" />
        <Class number="ES.1802" title="Multi-variable Calculus" />
      </Semester>
      <Semester title="Fall 2021">
        <Class number="ES.801" title="Physics I" />
        <Class number="ES.1801" title="Calculus" />
        <Class number="ES.5111" title="Principles of Chemical Science" />
        <Class number="24.02" title="Moral Problems and the Good Life" />
      </Semester>
    </>
  );
}

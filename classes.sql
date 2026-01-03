-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 27, 2025 at 02:57 PM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ariadq7b_Kawish`
--

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` varchar(50) NOT NULL,
  `class_name` varchar(50) NOT NULL,
  `class_code` varchar(50) NOT NULL,
  `room_number` varchar(50) NOT NULL,
  `students_amount` int(10) NOT NULL,
  `timing` varchar(200) NOT NULL,
  `enrolled_students` int(10) NOT NULL,
  `students_type` varchar(50) NOT NULL,
  `class_fee` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `caretaker_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `mother_id` int(11) NOT NULL,
  `room_num` varchar(25) NOT NULL,
  `uniform_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `book_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `transportation_fee` decimal(10,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `class_name`, `class_code`, `room_number`, `students_amount`, `timing`, `enrolled_students`, `students_type`, `class_fee`, `created_at`, `caretaker_id`, `staff_id`, `mother_id`, `room_num`, `uniform_fee`, `book_fee`, `transportation_fee`) VALUES
('CLS25-1-00001', 'Class 10', 'A', '', 12, '', 12, 'F', '1800', '2025-04-15 06:02:36', 0, NULL, 0, '', 500.00, 1500.00, 1000.00),
('CLS25-1-00002', 'Class 9', 'A', '', 0, '', 0, '', '1800', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00003', 'Class 8', 'A', '', 0, '', 0, '', '1800', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00004', 'Class 8', 'B', '', 0, '', 0, '', '1800', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00005', 'Class 7', 'A', '', 0, '', 0, '', '1800', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00006', 'Class 7', 'B', '', 0, '', 0, '', '1800', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00007', 'Class 6', 'A', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00008', 'Class 6', 'B', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00009', 'Class 6', 'C', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00010', 'Class 5', 'A', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00011', 'Class 5', 'B', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00012', 'Class 5', 'C', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00013', 'Class 4', 'A', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00014', 'Class 4', 'B', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00015', 'Class 4', 'C', '', 0, '', 0, '', '1500', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00016', 'Class 3', 'A', '', 0, '', 0, '', '1200', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00017', 'Class 3', 'B', '', 0, '', 0, '', '1200', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00018', 'Class 2', 'A', '', 0, '', 0, '', '1200', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00019', 'Class 2', 'B', '', 0, '', 0, '', '1200', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00020', 'Class 1', 'A', '', 0, '', 0, '', '1200', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00021', 'Class 1', 'B', '', 0, '', 0, 'F', '1200', '2025-04-15 06:02:36', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00023', 'Prep', 'A', '', 0, '', 0, 'M', '1200', '2025-03-29 07:33:19', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00024', 'KG', 'A', '', 0, '', 0, '', '1000', '2025-03-29 07:33:19', 0, NULL, 0, '', 0.00, 1500.00, 1000.00),
('CLS25-1-00025', 'Class 1', 'C', '', 0, '', 0, '', '1200', '2025-04-15 06:02:36', 0, NULL, 0, '', 1000.00, 1500.00, 1500.00),
('CLS25-1-00026', 'Prep', 'B', '', 0, '', 0, '', '', '2025-04-15 07:16:25', 0, NULL, 0, '', 0.00, 0.00, 0.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_staff_id` (`staff_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `fk_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
